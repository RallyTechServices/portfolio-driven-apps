(function() {

    var Ext = window.Ext4 || window.Ext;

    /**
     * @private
     */

    Ext.define('Rally.ui.popover.PlannedHeadcountPopover', {

        extend: 'Rally.ui.popover.Popover',
        alias: 'popover.plannedheadcountpopover',
        modal: false,
        placement: 'bottom',
        shouldHidePopoverOnBodyClick: true,
        saveOnClose: false,
        cls: 'planned-velocity-popover',
        title: 'Planned Velocity',
        width: 400,
        header: true,
        offsetFromTarget: [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 20 },
            { x: 0, y: 0 }
        ],
        constructor: function (config) {
            this.callParent(arguments);
            var onSaveClicked = Ext.bind(config.onSaveClicked, this),
                /**
                 * Override to accomodate entering headcount and converting to points
                 * @type {string}
                 */
                label = "headcount", //config.unitName.toLowerCase(),
                plannedVelocityFieldId = 'plannedVelocityField',
                /**
                 * override to accommodate entering headcount and converting to points
                 */
                currentHeadcount = (config.plannedVelocity / 100).toFixed(2);

            this.add([{
                layout: {
                    type: 'hbox',
                    align: 'middle'
                },
                items: [
                    {
                        flex: 3,
                        xtype: 'numberfield',
                        value: currentHeadcount,
                        fieldLabel: config.projectName + '<br/><span style="font-family: NotoSansBold">' + config.releaseName + "</span>",
                        hideTrigger: true,
                        labelAlign: 'left',
                        labelPad: 50,
                        labelStyle: 'color: white; font-size: 13px; padding-left: 10px; line-height: 16px;',
                        labelSeparator: '',
                        labelWidth: 165,
                        maxTextLength: 9,
                        maxDecimalPrecision: 3,
                        id: plannedVelocityFieldId,
                        inputAttrTpl: 'style="height: 30px; padding: 5px;  font-size: 13px; text-align: right; width: 65px;',
                        enableKeyEvents: true,
                        minValue: 0,
                        width: 275,
                        selectOnFocus: true,
                        listeners: {
                            keyup: function (form, event) {
                                if (event.getKey() === event.ENTER) {
                                    onSaveClicked();
                                }
                            }
                        }
                    },
                    {
                        flex: 1,
                        xtype: 'panel',
                        style: 'padding-top: 10px; font-size: 12px; vertical-align: middle; margin-top: 3px; padding-left: 5px; position: relative; bottom: 8px;',
                        html: label
                    }
                ]
            }]);

            if (config.hasChildren) {
                this.add([{
                    style: "padding-left: 10px; padding-top: 10px;",
                    cls: 'children-planned-velocity-rollup',
                    items: [{
                        colspan: 2,
                        xtype: 'component',
                        html: 'Child Project\'s Release rollup',
                        cls: 'popover-label',
                        style: 'display: inline-block; width: 50%; font-size: 12px;'
                    },
                        {
                            xtype: 'component',
                            html: '(<span class="children-planned-velocity-rollup-value">' + config.childVelocity + '</span>) ' + label,
                            cls: 'popover-label',
                            style: 'display: inline-block; width: 50%; text-align: right; font-size: 12px; padding-right: 15px;'
                        }]
                }]);
            }


            this.add([{
                cls: 'capacity-buttons',
                style: 'padding-top: 15px; text-align: center;',
                items: [
                    {
                        xtype: 'rallybutton',
                        itemId: 'capacityDone',
                        text: 'Save',
                        cls: 'primary button small rly-right',
                        style: 'float: none;',
                        listeners: {
                            click: config.onSaveClicked,
                            scope: this
                        }
                    },
                    {
                        xtype: 'rallybutton',
                        itemId: 'capacityCancel',
                        text: 'Cancel',
                        cls: 'secondary dark button small rly-right',
                        style: 'float: none;',
                        listeners: {
                            click: config.onCancelClicked,
                            scope: this
                        }
                    }
                ]
            }]);

            Ext.getCmp(plannedVelocityFieldId).focus();
        }

    });
}).call(this);
