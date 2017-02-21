Ext.define("portfolioSelectorApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        this._addSelector();
    },
    _addSelector: function(){
        this.removeAll();

        this.add({
            xtype: 'portfolioselector',
            type: this.getSetting('selectorType'),
            stateId: this.getContext().getScopedStateId('app-selector'),
            flex: 1
        });
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },

    isExternal: function(){
        return typeof(this.getAppId()) === 'undefined';
    },
    onSettingsUpdate: function (settings){
        Ext.apply(this, settings);
        this._addSelector();
    },
    getSettingsFields: function() {
        var filters = [{
            property: 'TypePath',
            operator: 'contains',
            value: 'PortfolioItem/'
        }];

        return [{
            name: 'selectorType',
            xtype: 'rallycombobox',
            allowBlank: false,
            autoSelect: false,
            shouldRespondToScopeChange: true,
            fieldLabel: 'Results Type',
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
            readyEvent: 'ready'
        }];
    }
});