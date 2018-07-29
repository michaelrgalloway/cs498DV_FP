
(function () {
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    var w = 1150,
        h = 600,
        x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([0, h]),
        color = d3.scale.category20c(),
        root,
        node;

    var treemap = d3.layout.treemap()
        .round(true)
        .size([w-5, h-5])
        .sticky(true)
        .value(function (d) { return d.backers; });

    var svg = d3.select(".treemap-wrapper").append("div")
        .attr("class", "chart")
        .style("width", "100%")
        .style("height", "100%")
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
        .attr("transform", "translate(.5,.5)");

    var tBackers, tProjects, tGoal;
    d3.json("data.json", function (data) {

        node = root = data;
        var nodes = treemap.nodes(root)
            .filter(function (d) { return !d.children; });


        var cell = svg.selectAll("g")
            .data(nodes)
            .enter().append("svg:g")
            .attr("class", function (d) {
                if (d.category == "Tabletop Games") {
                    return "cell tabletopgames";
                }
                return "cell";
            })
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on("click", function (d) { return zoom(node == d.parent ? root : d.parent); })
            .on("mousemove", function (d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(
                    "Main Category: " + d.parent.category + "<br/>" +
                    "Category: " + d.category + "<br/>" +
                    "Backers: " + d3.format(",")(d.backers) + "<br/>" +
                    "Projects: " + d3.format(",")(d.numproj) + "<br/>" +
                    "Avg. Goal: " + d3.format(",.2f")(d.totalgoal / d.numproj))
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });;

        var inner = cell.append("svg:rect")
            .attr("width", function (d) { return d.dx - 1; })
            .attr("height", function (d) { return d.dy - 1; })
            .attr("style", function (d) {
                if (d.category == "Tabletop Games") {
                    return "outline: 2px solid #8b0000;";
                }
            })

            .style("fill", function (d) { return color(d.parent.category); })
            ;





        cell.append("svg:text")
            .attr("x", function (d) { return d.dx / 2; })
            .attr("y", function (d) { return (d.dy / 2); })
            .attr("dy", ".35em")
            .style("font-size", "12px")
            .style("cursor", "default")
            .attr("class", "mainC")
            .attr("text-anchor", "middle")
            .text(function (d) { return d.category; })
            .style("opacity", function (d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });
        svg.selectAll(".tabletopgames").append("svg:text")
            .attr("x", function (d) { return d.dx / 2; })
            .attr("y", function (d) { return 12; })
            .attr("dy", ".35em")
            .style("font-size", "12px")
            .style("fill", "#8b0000")
            .style("cursor", "default")
            .style("font-weight","bold")
            .attr("class", "specialtext")
            .attr("text-anchor", "middle")
            .text(function (d) { return "Most Backers per Project"; }).call(wrap, 70)
            .style("opacity", function (d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

        d3.select(window).on("click", function () { zoom(root); });

        d3.select(".adjsutByProjects").on("click", function () {
            treemap.value(function (d) { return d.numproj; }).nodes(root);
            zoom(node);
        });
        d3.select(".adjustByBackers").on("click", function () {
            treemap.value(function (d) { return d.backers; }).nodes(root);
            zoom(node);
        });
        d3.select(".adjsutByGoal").on("click", function () {
            treemap.value(function (d) { return d.totalgoal; }).nodes(root);
            zoom(node);
        });
    });



    function zoom(d) {
        console.log("testett")
        var kx = w / d.dx, ky = h / d.dy;
        x.domain([d.x, d.x + d.dx]);
        y.domain([d.y, d.y + d.dy]);

        var t = svg.selectAll("g.cell").transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .attr("transform", function (d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

        t.select("rect")
            .attr("width", function (d) { return kx * d.dx - 1; })
            .attr("height", function (d) { return ky * d.dy - 1; })

        t.select(".mainC")
            .attr("x", function (d) { return kx * d.dx / 2; })
            .attr("y", function (d) { return ky * d.dy / 2; })
            .style("opacity", function (d) { return kx * d.dx > d.w ? 1 : 0; });
        t.select(".specialtext")
            .attr("x", function (d) { return kx * d.dx / 2; })
            .attr("y", function (d) { return 12; })
            .style("opacity", function (d) { return kx * d.dx > d.w ? 1 : 0; });

        node = d;
        d3.event.stopPropagation();
    }
})();

