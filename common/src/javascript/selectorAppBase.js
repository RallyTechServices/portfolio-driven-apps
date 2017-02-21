Ext.define('portfolioDrivenApps.common.appBase', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {

        this.fetchPortfolioItemTypes().then({
            success: function(portfolioItemTypes){
                this.portfolioItemTypes = portfolioItemTypes;
                this.addComponents();
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            },
            scope: this
        });
    },
    showAppMessage: function(container, msg){
        container.add({
            xtype: 'container',
            html: Ext.String.format('<div class="no-data-container"><div class="secondary-message">{0}</div></div>',msg)
        });
    },
    showErrorMessage: function(container, msg){
        container.add({
            xtype: 'container',
            html: Ext.String.format('<div class="no-data-container"><div class="secondary-message" style="color:red;">{0}</div></div>',msg)
        });
    },
    isReleaseScoped: function(){
        return this.getContext().getTimeboxScope() && this.getContext().getTimeboxScope().getType() === 'release' || false;
    },
    /**
     * addComponents
     *
     * -- adds a header container
     * -- checks to see if we should add a portfolio item selector to this app, or listen for published messages from another app on the dashboard.
     * If we are listening for published messages from another app on the dashboard, then we will send a message asking for that app to send us the currently
     * selected portfolio item ('requestPortfolioItem' message);
     *
     */
    addComponents: function(){

        this.removeAll();

        this.headerContainer = this.add({xtype:'container',itemId:'header-ct', layout: {type: 'hbox'}});

        if ( this.getSetting('showScopeSelector') === true || this.getSetting('showScopeSelector') === "true" ) {
            this.headerContainer.add({
                xtype: 'portfolioselector',
                context: this.getContext(),
                type: this.getSetting('selectorType'),
                stateId: this.getContext().getScopedStateId('app-selector'),
                width: '75%',
                listeners: {
                    change: this.updatePortfolioItem,
                    scope: this
                }
            });
        } else {
            this.subscribe(this, 'portfolioItemSelected', this.updatePortfolioItem, this);
            this.publish('requestPortfolioItem', this);
        }
    },
    /**
     * updatePortfolioItem
     * @param portfolioItemRecord
     * this function is called when a portfolio item is selected, either by the selector on the app (if configured) or becuase a message was published.
     * This function should ideally be overridden in classes that extend from this
     *
     */
    updatePortfolioItem: function(portfolioItemRecord){
        this.portfolioItem = portfolioItemRecord;
    },
    /**
     * getSEttingsFields
     * @returns {*[]}
     *
     * returns an array of components used to enter AppSettings
     * see https://help.rallydev.com/apps/2.1/doc/#!/guide/settings for details on using App Settings
     *
     */
    getSettingsFields: function() {

        var filters = [{property: 'TypePath', operator: 'contains', value: 'PortfolioItem/'}];
        return [
            {
                name: 'showScopeSelector',
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Show Scope Selector',
                bubbleEvents: ['change']
            },
            {
                name: 'selectorType',
                xtype: 'rallycombobox',
                allowBlank: false,
                autoSelect: false,
                shouldRespondToScopeChange: true,
                fieldLabel: 'Selector Type',
                context: this.getContext(),
                storeConfig: {
                    model: Ext.identityFn('TypeDefinition'),
                    sorters: [{ property: 'DisplayName' }],
                    fetch: ['DisplayName', 'ElementName', 'TypePath', 'Parent', 'UserListable'],
                    filters: filters,
                    autoLoad: false,
                    remoteSort: false,
                    remoteFilter: true
                },
                displayField: 'DisplayName',
                valueField: 'TypePath',
                readyEvent: 'ready',
                handlesEvents: {
                    change: function(chk){
                        this.setDisabled(chk.getValue()!==true);
                    }
                }
            }
        ];
    },
    /**
     * fetchPortfolioItemTypes
     * @returns {Deft.promise|*|r.promise|promise}
     *
     * Promise that returns the portfolio item types in hierarchical order
     *
     */
    fetchPortfolioItemTypes: function(){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'TypeDefinition',
            fetch: ['TypePath', 'Ordinal','Name'],
            filters: [{
                property: 'TypePath',
                operator: 'contains',
                value: 'PortfolioItem/'
            }],
            sorters: [{
                property: 'Ordinal',
                direction: 'ASC'
            }]
        });
        store.load({
            callback: function(records, operation, success){
                if (success){
                    var portfolioItemTypes = new Array(records.length);
                    _.each(records, function(d){
                        //Use ordinal to make sure the lowest level portfolio item type is the first in the array.
                        var idx = Number(d.get('Ordinal'));
                        portfolioItemTypes[idx] = { typePath: d.get('TypePath'), name: d.get('Name') };
                        //portfolioItemTypes.reverse();
                    });
                    deferred.resolve(portfolioItemTypes);
                } else {
                    var error_msg = '';
                    if (operation && operation.error && operation.error.errors){
                        error_msg = operation.error.errors.join(',');
                    }
                    deferred.reject('Error loading Portfolio Item Types:  ' + error_msg);
                }
            }
        });
        return deferred.promise;
    },
    /**
     * fetchWsapiRecords
     * @param config
     * @returns {Deft.Deferred}
     *
     * Generic promise wrapped to return records from the wsapi database
     */
    fetchWsapiRecords: function(config){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',config).load({
            callback: function(records, operation, success){
                if (success){
                    deferred.resolve(records);
                } else {
                    deferred.reject(Ext.String.format("Error getting {0} for {1}: {2}", config.model, config.filters.toString(), operation.error.errors.join(',')));
                }
            }
        });
        return deferred;
    }

});
