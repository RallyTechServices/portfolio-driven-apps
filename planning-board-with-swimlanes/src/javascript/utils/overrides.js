
Ext.override(Rally.ui.gridboard.planning.TimeboxColumnProgressBar,{

    constructor: function(config) {
        this.callParent(arguments);
        this.renderTpl = Ext.create('Rally.ui.renderer.template.progressbar.TimeboxProgressBarTemplate', {
            height: '18px',
            width: '80%',
            offsetWidth: '10%',
            progressBarComponent: this,
            /**
             * override the text rendering functions to divide by 100 for headcount and change
             * terminology to headcount instead of velocity
             */
            generateAmountCompleteText: function(recordData) {
                return Ext.util.Format.round(recordData.amountComplete/100, 2);
            },
            generateChildrenTotalVelocityText: function(recordData) {
                return recordData.childVelocity ? '(' + Ext.util.Format.round(recordData.childVelocity/100, 2) + ')' : '';
            },
            generateTotalPlannedVelocityText: function(recordData) {
                // The progressbar links to "Set Planned Velocity" if there is no planned velocity for the current
                // project and iteration (the "parent"), so we check that even though the total is what gets displayed.
                return (recordData.parentVelocity && recordData.total) ? Ext.util.Format.round(recordData.total/100, 2) : '<a href="#">Set Planned Headcount</a>';
            }
        });
        this.attribute = config.attribute;
    },

    _createTooltip: function() {
        if (this.tooltip) {
            this._destroyTooltip();
        }
        /**
         * override for terminolgy update from Velocity to Headcount
         * @type {Rally.ui.tooltip.ToolTip}
         */
        this.tooltip = Ext.create('Rally.ui.tooltip.ToolTip', {
            cls: 'set-planned-velocity-tooltip',
            bodyStyle: 'text-align: center;',
            width: 150,
            anchor: 'top',
            target: this._getProgressBarContainer(),
            html: 'Edit Planned Headcount'
        });
    },

    _createPopoverWithData: function() {
        var saveTimeboxRecord = Ext.bind(this._saveTimeboxRecord, this),
            enableTooltip = Ext.bind(this._enableTooltip, this);

        /**
         * override to use modified popover
         */
        Ext.create('Rally.ui.popover.PlannedHeadcountPopover', {
            plannedVelocity: this._getParentPlannedVelocityRollup(),
            childVelocity: this._getChildrenPlannedVelocityRollup(),
            hasChildren: this._hasChildren(),
            projectName: this._getProjectName(),
            releaseName: this._getReleaseName(),
            target: this._getProgressBarContainer(),
            unitName: this._getUnitName(),
            onSaveClicked: function() {
                var plannedVelocity = Ext.getCmp('plannedVelocityField').getValue();
                /**
                 * override to covert from headcount to points
                 */
                plannedVelocity = plannedVelocity * 100;
                saveTimeboxRecord(plannedVelocity);
                this.close();
            },
            onCancelClicked: function() {
                enableTooltip();
                this.close();
            },
            listeners: {
                hide: function() {
                    this._enableTooltip();
                },
                close: function() {
                    this._enableTooltip();
                },
                scope: this
            }
        });
    }
});

Ext.override(Rally.ui.cardboard.row.Header, {

    renderTpl: null,

    initComponent: function() {

        //We need to dynamically build the render tpl for the number of columns

        this.renderTpl = Ext.create('Ext.XTemplate', this._buildRenderTpl());
        this.renderData = {title: this._getTitle()};

        this.callParent(arguments);
        this.on('afterrender', this.onColumnsUpdated, this);
    },
    _buildRenderTpl: function(){
        var tpl = '';
        Ext.Array.each(this.columns, function(c, idx){
            if (idx === 0){
                tpl += '<td class="row-header-cell"><div class="row-header-title">{title}</div></td>';
            } else {
                tpl += '<td class="row-header-cell"><div class="cell-' + idx + ' row-cell-summary"> -- headcount (-- Epics)</div></td>';
            }
        }, this);
        return tpl;
    },

    _getCellText: function(col, idx){

        if (col.store.isLoading()){
            col.store.on('load', this.onColumnsUpdated, this);
            return;
        }

        if (idx === 0){
            return this._getTitle();
        }
        var thisRef = this.getValue() && this.getValue()._ref;

        var est = 0,
            epicCount = 0;

        col.store.each(function(r){
            var parentRef = r.get('Parent') && r.get('Parent')._ref;

            if (parentRef === thisRef){
                est += r.get('PreliminaryEstimate') && r.get('PreliminaryEstimate').Value || 0;
                epicCount++;
            }
        }, this);
        return Ext.String.format("{0} headcount ({1} Epics)",est/100, epicCount);
    },
    onColumnsUpdated: function() {

        Ext.Array.each(this.columns, function(c,idx){
            var text = this._getCellText(c,idx);
            var cell = this.getEl().down('.cell-' + idx);
            if (cell){
                cell.update(text);
            }
        }, this);
    }
});