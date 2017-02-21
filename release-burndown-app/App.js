Ext.define('releaseBurndownApp', {
    extend: 'portfolioDrivenApps.common.appBase',
    componentCls: 'app',

    RELEASE_SCOPE_MSG: 'This app is designed for an Release scoped dashboard.  Please update the current dashboard to have an Release scope.',
    PORTFOLIO_MSG: "Please select a Portfolio Item.",

    launch: function() {
        this.callParent(arguments);
        this.updateView();
    },
    updatePortfolioItem: function(portfolioItemRecord){
        this.portfolioItem = portfolioItemRecord;
        this.updateView(portfolioItemRecord);
    },

    getDisplayBox: function(){
        if (!this.down('#displayBox')){
            this.add({
                xtype: 'container',
                itemId: 'displayBox'
            });
        }
        return this.down('#displayBox');
    },
    getTimeboxScope: function(){
        return this.getContext().getTimeboxScope();
    },
    /**
     *
     * @param timeboxScope
     * This function is the callback for when the timebox selector on the dashboard changes.
     */
    onTimeboxScopeChange: function(timeboxScope) {
        if (!timeboxScope){
            timeboxScope = this.getContext().getTimeboxScope();
        }

        if(timeboxScope && timeboxScope.getType() === 'release') {
            this.getContext().setTimeboxScope(timeboxScope);
            this.updateView();
        }
    },
    updateView: function(){

        this.getDisplayBox().removeAll();

        if (!this.getTimeboxScope()){
            this.showAppMessage(this.getDisplayBox(), this.RELEASE_SCOPE_MSG);
            return;
        }
        if (!this.portfolioItem ){
            this.showAppMessage(this.getDisplayBox(), this.PORTFOLIO_MSG);
            return;
        }

        this.fetchPortfolioItemsInRelease(this.portfolioItem ).then({
            success: this.buildBurndown,
            failure: this.showErrorMessage,
            scope: this
        });


    },
    fetchPortfolioItemsInRelease: function(portfolioItemRecord){

        var filter = this.getContext().getTimeboxScope().getQueryFilter();
        var selectedPortfolioItemType = portfolioItemRecord.get('_type').toLowerCase(),
            parentArray = [];

        Ext.Array.each(this.portfolioItemTypes, function(p){
            if (p.typePath.toLowerCase() === selectedPortfolioItemType){
                return false;
            }
            parentArray.push('Parent');
        });

        if (parentArray.length > 0){
            filter = filter.and({
                property: parentArray.join('.'),
                value: portfolioItemRecord.get('_ref')
            });
        } else {
            filter = filter.and({
                property: 'ObjectID',
                value: portfolioItemRecord.get('ObjectID')
            });
        }

        var config = {
            model: this.portfolioItemTypes[0].typePath,
            fetch: ['ObjectID'],
            limit: 'Infinity',
            pageSize: 2000,
            filters: filter
        };

        return this.fetchWsapiRecords(config);
    },
    buildBurndown: function(featuresInRelease){
        //console.log('featuresInRelease', featuresInRelease);

        this.getDisplayBox().add({
            xtype: 'rallychart',
            storeType: 'Rally.data.lookback.SnapshotStore',
            storeConfig: this.getStoreConfig(featuresInRelease),
            calculatorType: 'portfolioDrivenApps.releaseBurndownApp.BurndownCalculator',
            calculatorConfig: {
                stateFieldName: 'ScheduleState',
                stateFieldValues: ['Defined', 'In-Progress', 'Completed', 'Accepted'],
                startDate: this.getTimeboxScope().getRecord().get('ReleaseStartDate'),
                endDate: this.getTimeboxScope().getRecord().get('ReleaseDate')
            },
            chartConfig: this.getChartConfig()
        });
    },
    getStoreConfig: function(features){
        var featureOids = Ext.Array.map(features, function(f){ return f.get('ObjectID'); });
        //console.log('featureOids', featureOids);
        return {
            find: {
                _TypeHierarchy: 'HierarchicalRequirement',
                _ItemHierarchy: { $in : featureOids}
            },
            fetch: ['ScheduleState','PlanEstimate'],
            hydrate: ['ScheduleState'],
            sort: {
                _ValidFrom: 1
            },
            removeUnauthorizedSnapshots: true,
            useHttpPost: true,
            limit: Infinity
        };
    },
    getChartTitle: function(){
        return Ext.String.format('Release Burndown for {0}: {1}', this.portfolioItem.get('FormattedID'), this.portfolioItem.get('Name'));
    },
    getChartConfig: function() {
        //http://api.highcharts.com/highcharts

        return {
            chart: {
                zoomType: 'xy',
                type: 'column'
            },
            title: {
                text: this.getChartTitle(),
                style: {
                    color: '#666',
                    fontSize: '18px',
                    fontFamily: 'ProximaNova',
                    fill: '#666'
                }
            },
            xAxis: {
                tickmarkPlacement: 'on',
                tickInterval: 20,
                title: {
                    text: 'Date',
                    style: {
                        color: '#444',
                        fontFamily: 'ProximaNova',
                        textTransform: 'uppercase',
                        fill: '#444'
                    }
                },
                labels: {
                    style: {
                        color: '#444',
                        fontFamily: 'ProximaNova',
                        textTransform: 'uppercase',
                        fill: '#444'
                    },
                    formatter: function () {
                        var d = new Date(this.value);
                        return Rally.util.DateTime.format(d, 'm/d/Y');
                    }
                }
            },
            yAxis: [
                {
                    title: {
                        text: 'Points',
                        style: {
                            color: '#444',
                            fontFamily: 'ProximaNova',
                            textTransform: 'uppercase',
                            fill: '#444'
                        }
                    },
                    labels: {
                        style: {
                            color: '#444',
                            fontFamily: 'ProximaNova',
                            textTransform: 'uppercase',
                            fill: '#444'
                        }
                    }
                }
            ],
            legend: {
                itemStyle: {
                    color: '#444',
                    fontFamily: 'ProximaNova',
                    textTransform: 'uppercase'
                },
                borderWidth: 0
            },
            tooltip: {
                backgroundColor: '#444',
                headerFormat: '<span style="display:block;margin:0;padding:0 0 2px 0;text-align:center"><b style="font-family:NotoSansBold;color:white;">{point.key}</b></span><table><tbody>',
                footerFormat: '</tbody></table>',
                pointFormat: '<tr><td class="tooltip-label"><span style="color:{series.color};width=100px;">\u25CF</span> {series.name}</td><td class="tooltip-point">{point.y}</td></tr>',
                shared: true,
                useHTML: true,
                borderColor: '#444'


            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    }
                },
                area: {
                    stacking: 'normal'
                }
            }
        };
    }
});
