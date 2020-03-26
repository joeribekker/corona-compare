window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

var ctx = document.getElementById('chart-cases').getContext('2d');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'Corona cases'
        },
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
                    labelString: 'Cases'
                }
            }]
        }
    }
});

var countryOptionsTempate = $("#country-options-template").html();

var cachedDatasets = [];

$.getJSON("https://raw.githubusercontent.com/joeribekker/corona-compare/master/data/stats.json", function(data) {
    cache = data

    $.each(data, function(index, element) {
        var colors = Object.values(window.chartColors)
        var color = colors[index % colors.length]

        // FIXME: Should be global labels?
        if (index == 0) {
            $.each(element.data.dates, function(index, element) {
                chart.data.labels.push(element)
            });
        }

        cachedDatasets.push({
            label: element.name,
            borderColor: color,
            data: element.data.cases,
        })

        html = Mustache.render(countryOptionsTempate, {'chart': 'cases', 'country': element.name});
        $("form").append(html)
    });

    $("input").on("click", function(e) {
        var el = $(this);
        if (el.is(":checked") === false) {
            chart.data.datasets = chart.data.datasets.filter(function(obj) {
                return (obj.label != el.attr("id"));
            });
        }
        else {
            var dataset = cachedDatasets.find(function(obj) {
                return obj.label == el.attr("id");
            });
            chart.data.datasets.push(dataset);
        }
        chart.update();
    });

});