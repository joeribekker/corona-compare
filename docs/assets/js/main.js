window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

var countryOptionsTempate = $("#country-options-template").html();
var chartTemplate = $("#chart-template").html();

var chartOptions = function(name) {
    return {
        responsive: true,
        aspectRatio: 1.75,
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: name
                }
            }]
        }
    }
};

var cachedDatasets = {};

$.getJSON("https://raw.githubusercontent.com/joeribekker/corona-compare/master/data/stats.json", function(data) {

    // Create country selection
    $.each(data.countries, function(countryId, countryName) {
        var html = Mustache.render(countryOptionsTempate, {'countryId': countryId, 'countryName': countryName});
        $("form").append(html)
    });

    // Create chart elements
    $.each(data.charts, function(chartId, chartName) {
        var html = Mustache.render(chartTemplate, {'chartId': chartId, 'chartName': chartName});
        $("#chart-container").append(html)

        var ctx = document.getElementById("chart-" + chartId).getContext('2d');
        var chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: chartOptions(chartName)
        })

        window.charts = window.charts || {};
        window.charts[chartId] = chart

        // Initialize cachedDatasets with chart types
        cachedDatasets[chartId] = [];
    });

    var colors = Object.values(window.chartColors)

    // Add data to charts
    $.each(data.datasets, function(index, dataset) {
        var countryId = dataset.country;
        var color = colors[index % colors.length];

        $.each(dataset.data, function(index, data) {
            // FIXME: Should be global labels?
            $.each(window.charts, function(chartId, chart) {
                if (chart.data.labels.length == 0) {
                    $.each(data.dates, function(index, date) {
                        chart.data.labels.push(date);
                    });
                }
            });

            var chartId = data.chart;
            cachedDatasets[chartId].push({
                label: countryId,
                borderColor: color,
                data: data.values,
            });
        });

    });

    // Update datasets on chart when country selections changes
    $("input").on("click", function(e) {
        var el = $(this);
        if (el.is(":checked") === false) {

            $.each(window.charts, function(chartId, chart) {
                chart.data.datasets = chart.data.datasets.filter(function(obj) {
                    return (obj.label != el.attr("id"));
                });
                chart.update();
            });

        }
        else {
            $.each(window.charts, function(chartId, chart) {
                var dataset = cachedDatasets[chartId].find(function(obj) {
                    return obj.label == el.attr("id");
                });
                chart.data.datasets.push(dataset);
                chart.update();
            });
        }
    });

});