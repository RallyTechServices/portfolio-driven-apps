Ext.override(Rally.ui.filter.CustomFilterRow, {
    _getItems: function() {
        var items = [
            {
                xtype: 'rallycombobox',
                itemId: 'fieldCombobox',
                disabled: true,
                autoLoad: false,
                defaultSelectionPosition: null,
                store: Ext.create('Ext.data.Store', {
                    fields: ['attributeDefinition', 'displayName', 'modelNames', 'name']
                }),
                displayField: 'displayName',
                emptyText: 'Choose Field...',
                valueField: 'name',
                matchFieldWidth: true,
                listeners: {
                    select: this._onFieldSelect,
                    afterrender: this._onFieldAfterRender,
                    expand: this._onFieldExpand,
                    scope: this
                },
                width: this.boxWidths.field,
                filterProperties: ['displayName'],
                listConfig: {
                    itemTpl: new Ext.XTemplate('' +
                        '{displayName}',
                        '<tpl if="this.hasModelNames(values)">',
                        '<div class="duplicate-field-model-name">- {modelNames}</div>',
                        '</tpl>',
                        {
                            hasModelNames: function (data) {
                                return data.modelNames.length > 0;
                            }
                        })
                }
            },
            {
                xtype: 'rallycombobox',
                itemId: 'operatorCombobox',
                disabled: true,
                autoLoad: false,
                editable: false,
                forceSelection: true,
                store: Ext.create('Ext.data.Store', {
                    fields: ['name', 'displayName'],
                    listeners: {
                        datachanged: this._onOperatorDataChanged,
                        scope: this
                    }
                }),
                displayField: 'displayName',
                valueField: 'name',
                matchFieldWidth: true,
                listeners: {
                    setvalue: this._onOperatorSetValue,
                    scope: this
                },
                width: this.boxWidths.operator
            }
        ];

        if (!this._hasInitialData()) {
            items.push({
                xtype: 'rallytextfield',
                itemId: 'valueField',
                disabled: true,
                height: 22,
                width: this.boxWidths.value
            });
        }
        return items;
    }

});

Ext.override(Rally.ui.filter.CustomFilterPanel,{
    _getItems: function() {
        return [
            {
                xtype: 'container',
                cls: 'custom-filter-header',
                layout: 'column',
                defaults: {
                    xtype: 'component',
                    cls: 'filter-panel-label'
                },
                items: [
                    {
                        height: 1,
                        width: 30
                    },
                    // CHANGED these values to make headers line up
                    {
                        html: 'Field',
                        width: this.boxWidths.field + 5 || 135
                    },
                    {
                        html: 'Operator',
                        width: this.boxWidths.operator + 5|| 140
                    },
                    {
                        html: 'Value',
                        width: this.boxWidths.value + 5 || 155
                    }
                ]
            },
            {
                xtype: 'container',
                itemId: 'customFilterRows'
            }
        ];
    }
});

Ext.override(Ext.util.Filter,{
    createFilterFn: function() {
        var me       = this,
            matcher  = me.createValueMatcher();

        var property = me.property;

        if ( !Ext.isArray(me.property) && /,/.test(me.property) ) {
            property = me.property.split(',');
        }

        return function(item) {
            var hasmatch = false;
            for(var i=0;i<property.length;i++) {
                if(matcher.test(me.getRoot.call(me, item)[property[i]])) {
                    hasmatch=true;
                    break;
                }
            }
            return matcher === null ? me.value === null : hasmatch;
        };
    }
});


Ext.override(Rally.ui.combobox.ComboBox, {

    doLocalQuery: function(queryPlan) {
        var me = this,
            queryString = queryPlan.query;

        // Create our filter when first needed
        if (!me.queryFilter) {
            // Create the filter that we will use during typing to filter the Store
            me.queryFilter = new Ext.util.Filter({
                id: me.id + '-query-filter',
                anyMatch: true,
                caseSensitive: false,
                root: 'data',
                property: me.filterProperties
            });

            me.store.addFilter(me.queryFilter, false);
        }

        // Querying by a string...
        if (queryString || !queryPlan.forceAll) {
            me.queryFilter.disabled = false;
            me.queryFilter.setValue(me.enableRegEx ? new RegExp(queryString) : queryString);
        }

        // If forceAll being used, or no query string, disable the filter
        else {
            me.queryFilter.disabled = true;
        }

        // Filter the Store according to the updated filter
        me.store.filter();

        // Expand after adjusting the filter unless there are no matches
        if (me.store.getCount()) {
            me.expand();
        } else {
            me.collapse();
        }

        me.afterQuery(queryPlan);
    }
});


Ext.define('Rally.technicalservices.PortfolioParentComboBox',{
    extend: 'Rally.ui.combobox.FieldValueComboBox',
    _loadStoreValues: function() {
        this.field.getAllowedValueStore().load({
            requester: this,
            callback: function(records, operation, success) {
                var store = this.store;
                if (!store) {
                    return;
                }
                var noEntryValues = [],
                    labelValues = _.map(
                        _.filter(records, this._hasStringValue),
                        this._convertAllowedValueToLabelValuePair,
                        this
                    );

                if(this.field.getType() === 'boolean') {
                    labelValues = labelValues.concat([
                        this._convertToLabelValuePair('Yes', true),
                        this._convertToLabelValuePair('No', false)
                    ]);
                } else if (this.field.required === false) {
                    var name = "-- No Entry --",
                        value = "";
                    if (this.getUseNullForNoEntryValue()) {
                        value = null;
                    }
                    if (this.field.attributeDefinition.AttributeType.toLowerCase() === 'rating') {
                        name = this.getRatingNoEntryString();
                        value = "None";
                    }
                    noEntryValues.push(this._convertToLabelValuePair(name, value));
                }

                store.loadRawData(noEntryValues.concat(labelValues));
                store.fireEvent('load', store, store.getRange(), success);
            },
            scope: this
        });
    },

    _hasStringValue: function(allowedValueObject) {
        return allowedValueObject.get('StringValue') !== "";
    }
});