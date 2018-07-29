
(function () {
    var w = 900, width = w,
        h = 600, height = h,
        x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([0, h]);

    var svg = d3.select(".stackedbar-wrapper").append("div")
        .attr("class", "chart")
        .style("width", "100%")
        .style("height", "100%")
        .append("svg:svg")
        .attr("width", w + 250)
        .attr("height", h + 150)
        .append("svg:g")
        .attr("transform", "translate(50,20)");

    var div = d3.select(".tooltip")

    var data;
    mode = 1;//1 = measure by number of projects, 2 = measure by percent of project state
    zoomed = false;
    var filterData = function (data, category) {
        if (category == null) {
            var _set = Enumerable.From(data)
                .GroupBy("$.main_category", null,
                    function (key, g) {
                        return {
                            category: key,
                            successful: g.Sum("$.successful"),
                            failed: g.Sum("$.failed"),
                            canceled: g.Sum("$.canceled")
                        }
                    })
                .ToArray();
            zoomed = false;
            if (mode == 1) {
                return _set;
            }
            else {
                _set = _set.map(function (m) {
                    var total = m.successful + m.failed + m.canceled;
                    return {
                        category: m.category,
                        successful: ((m.successful / total) * 100),
                        failed: ((m.failed / total) * 100),
                        canceled: ((m.canceled / total) * 100)
                    };
                })
            }
            return _set;
        }
        else {
            zoomed = true;
            if (mode == 1) {
                return data.filter(function (f) { return f.main_category == category });
            }
            else {
                var _set = data.filter(function (f) { return f.main_category == category });
                _set = _set.map(function (m) {
                    var total = m.successful + m.failed + m.canceled;
                    return {
                        category: m.category,
                        successful: ((m.successful / total) * 100),
                        failed: ((m.failed / total) * 100),
                        canceled: ((m.canceled / total) * 100)
                    };
                });
                return _set;
            }
        }
    }

    var zoomIn = function (category) {
        if (zoomed) {
            renderChart(filterData(data, null));
        }
        else {
            renderChart(filterData(data, category.x));
        }
    };

    var changeMode = function (m) {
        mode = m;
        renderChart(filterData(data, null));
    }
    d3.json("data3.json", function (_data) {
        data = _data;
        renderChart(filterData(data));
    });

    var renderChart = function (data) {
        data.sort(function (a, b) { return b.successful - a.successful });
        var dataset = d3.layout.stack()(["successful", "failed", "canceled"].map(function (state) {
            return data.map(function (d) {
                return { x: d.category, y: +d[state] };
            });
        }));
        svg.selectAll("g")
            .remove();
        svg.selectAll("text")
            .remove();
        svg.selectAll("line")
            .remove();
        var x = d3.scale.ordinal()
            .domain(dataset[0].map(function (d) { return d.x; }))
            .rangeRoundBands([10, width - 10], 0.02);

        var y = d3.scale.linear()
            .domain([0, d3.max(dataset, function (d) { return d3.max(d, function (d) { return d.y0 + d.y; }); })])
            .range([height, 0]);

        var colors = ["#004451", "#990033", "#f2b447"];

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5)
            .tickSize(-width, 0, 0)
            .tickFormat(function (d) { return d });

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 50)
            .attr("x", 0 - (height - 25))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text((mode == 1 ? "# of" : "% of") + " Projects");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function (d) {
                return "rotate(-65)"
            });;


        var groups = svg.selectAll("g.cost")
            .data(dataset);
        groups.exit().remove();
        groups.enter().append("g")
            .attr("class", "cost")
            .style("fill", function (d, i) { return colors[i]; })
            .on("click", function (d, i, k) { });


        var rect = groups.selectAll("rect")
            .data(function (d) { return d; });
        rect.exit().remove();
        rect.enter()
            .append("rect")
            .attr("class", function (d, i, k) {
                console.log("classtest", d, i, k)
                if (k == 2) {
                    var col = data[i];
                    if ((col.successful / (col.successful + col.failed + col.canceled)) > .6) {
                        return "successful";
                    }
                }
            })
            .on("click", function (d, i, k) { zoomIn(d); })
            .on("mousemove", function (d, i, k) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                var col = data[i];
                var state = '';
                if (k == 0) {
                    state = "Successful: " + d3.format(",.0f")(col.successful) + (mode == 1 ? "" : "%");
                }
                else if (k == 1) {
                    state = "Failed: " + d3.format(",.0f")(col.failed) + (mode == 1 ? "" : "%");
                }
                else if (k == 2) {
                    state = "Canceled: " + d3.format(",.0f")(col.canceled) + (mode == 1 ? "" : "%");
                }
                div.html(
                    "Category: " + col.category + "<br/>" +
                    state)
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .attr("x", function (d) { return x(d.x); })
            .attr("y", function (d) { return y(d.y0 + d.y); })
            .attr("height", 0)
            .attr("width", x.rangeBand())
            .transition()
            .attr("height", function (d) { return y(d.y0) - y(d.y0 + d.y); })
            .attr("width", x.rangeBand())
            .ease('bounce')
            .duration(1000);;
        var annObjects = [];
        groups.selectAll(".successful").each(function (d, i) { annObjects.push({ d: d, i: i }) });
        if (!zoomed) {
            if (mode == 1) {
                annObjects.forEach(function (d, i) {
                    svg.append("svg:text")
                        .attr("x", x(d.d.x))
                        .attr("y", 12)
                        //.attr("dy", ".35em")
                        .style("font-size", "12px")
                        .style("fill", "#8b0000")
                        .style("cursor", "default")
                        .attr("class", "specialtext")
                        .attr("text-anchor", "left")
                        .style("font-weight","bold")
                        .text("Over 60% Success Rate").call(wrap, 130);
                    svg.append("svg:line")
                        .attr("class", "arrow")
                        .attr("x1", x(d.d.x) + 10)
                        .attr("y1", 30)
                        .attr("x2", x(d.d.x) + 10)
                        .attr("y2", y(d.d.y0))
                        .attr("marker-end", "url(#arrow)");
                });
            }
            else {
                svg.append("svg:text")
                    .attr("x", w +10)
                    .attr("y",h/2)
                    .style("font-size", "12px")
                    .style("fill", "#8b0000")
                    .style("cursor", "default")
                    .attr("class", "specialtext")
                    .attr("text-anchor", "left")
                    .style("font-weight","bold")
                    .text("Tech Over 60% Failure Rate. (contains category of highest goal target)").call(wrap, 70);
                    svg.append("svg:line")
                    .attr("class", "arrow")
                    .attr("x1", w - 25)
                    .attr("y1", h/2)
                    .attr("x2", w +10)
                    .attr("y2", h/2)
                    .attr("marker-end", "url(#arrow)");
            }
        }
        console.log("annObjects", annObjects);
        // append("svg:text")
        // .attr("x", function (d) { console.log(d); return x(d.x) })
        // .attr("y", function (d) { return 12; })
        // .attr("dy", ".35em")
        // .style("font-size", "12px")
        // .style("fill", "#8b0000")
        // .style("cursor", "default")
        // .attr("class", "specialtext")
        // .attr("text-anchor", "middle")
        // .text(function (d) { return "Most Backers per Project"; }).call(wrap, 70)

        d3.select(".adjustByProjects2").on("click", function () {
            changeMode(1);
        });
        d3.select(".adjustByPercent").on("click", function () {
            changeMode(2);
        });
        var legend = svg.selectAll(".legend")
            .data(colors)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) { return "translate(30," + i * 19 + ")"; });

        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function (d, i) { return colors.slice().reverse()[i]; });

        legend.append("text")
            .attr("x", width + 5)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function (d, i) {
                switch (i) {
                    case 0: return "canceled";
                    case 1: return "failed";
                    case 2: return "successful";
                }
            });


        var tooltip = svg.append("g")
            .attr("class", "tooltip")
            .style("display", "none");

        tooltip.append("rect")
            .attr("width", 30)
            .attr("height", 20)
            .attr("fill", "white")
            .style("opacity", 0.5);

        tooltip.append("text")
            .attr("x", 15)
            .attr("dy", "1.2em")
            .style("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

    }
})();