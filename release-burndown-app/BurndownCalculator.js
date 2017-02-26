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
    },
    getSummaryMetricsConfig: function(){
        var me = this;
        return [{
            "as": "Remaining_intercept",
            "f": function(seriesData){
                var mb = me.calculateSlopeAndIntercept(seriesData, "Remaining");
                return mb.intercept;
            }
        },{
            "as": "Remaining_slope",
            "f": function(seriesData){
                var mb = me.calculateSlopeAndIntercept(seriesData, "Remaining");
                return mb.slope;
            }
        }];

    },
    getDerivedFieldsAfterSummary: function(){
        return [{
                  "as": "Trend",
                  "f": function(snapshot, index, metrics) {
                      if (!isNaN(metrics.Remaining_intercept) && !isNaN(metrics.Remaining_slope)){
                          return metrics.Remaining_intercept + metrics.Remaining_slope * index;
                          //return Ext.Number.toFixed(trendPoint, 2);
                      }
                      return null;

                  },
                  "display": "line"
              }];
    },
    calculateSlopeAndIntercept: function(seriesData, attribute){
        /**
         * Regression Equation(y) = a + bx
         * Slope(b) = (NΣXY - (ΣX)(ΣY)) / (NΣX2 - (ΣX)2)
         * Intercept(a) = (ΣY - b(ΣX)) / N
         */

        var sum_xy = 0;
        var sum_x = 0;
        var sum_y = 0;
        var sum_x_squared = 0;
        var n = 0;
        for (var i=0; i<seriesData.length; i++){
            if (seriesData[i][attribute]){
                sum_xy += seriesData[i][attribute] * i;
                sum_x += i;
                sum_y += seriesData[i][attribute];
                sum_x_squared += i * i;
                n++;
            }
        }

        var slope = (n*sum_xy - sum_x * sum_y)/(n*sum_x_squared - sum_x * sum_x),
            intercept = (sum_y - slope * sum_x)/n;

        return {
            slope: slope,
            intercept: intercept
        };
    }

});