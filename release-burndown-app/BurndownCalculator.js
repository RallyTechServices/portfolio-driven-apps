Ext.define("portfolioDrivenApps.releaseBurndownApp.BurndownCalculator", {
    extend: "Rally.data.lookback.calculator.TimeSeriesCalculator",

    getMetrics: function () {
        return [
            {
                "field": "PlanEstimate",
                "as": "Planned",
                "display": "line",
                "f": "sum"
            },
            {
                "field": "PlanEstimate",
                "as": "Remaining",
                "f": "filteredSum",
                "filterField": "ScheduleState",
                "filterValues": ['Defined', 'In-Progress', 'Completed'],
                "display": "column"
            }
        ];
    }
});