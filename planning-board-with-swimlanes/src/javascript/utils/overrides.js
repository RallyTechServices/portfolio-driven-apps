Ext.override(Rally.ui.gridboard.planning.TimeboxColumnProgressBar,{
    _getTotalPointCount: function() {
        var sums = this.store.getSums();
        var pointFieldSum = sums[this.pointField];
        if (pointFieldSum > 0){
            pointFieldSum = (pointFieldSum/100).toFixed(1);
        }

        return pointFieldSum || 0;
    }
});

Ext.override(Rally.ui.cardboard.row.Header, {

    renderTpl: null,
    data: {},

    initComponent: function() {

        //We need to dynamically build the render tpl since I have spent way too much time trying to tune a template

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
//                tpl += '<td class="row-header-cell"><div class="cell-' + idx + ' row-cell-summary" style="color:#222222;font-family:ProximaNovaSemiBold, Helvetica, Arial;border-radius:2px;font-size:11px;background-color:#e6e6e6;padding:3px;margin:2px;text-align:center;"></div></td>';
                tpl += '<td class="row-header-cell"><div class="cell-' + idx + ' row-cell-summary"></div></td>';
            }
        }, this);
        return tpl;
    },
    _buildRenderData: function(){

        var renderData = {};
        Ext.Array.each(this.columns, function(c, idx){
            var key = "cell" + String.fromCharCode(97 + idx);
            if (idx === 0){ key = "title"}
            renderData[key] = this._getCell(c, idx);
        }, this);

        return renderData;
    },
    _getCell: function(col, idx){

        if (idx === 0){
            return this._getTitle();
        }
        var thisRef = this.getValue() && this.getValue()._ref;

        var est = 0,
            storyCount = 0,
            epicCount = 0,
            estimateTotal = this.getValue() && this.getValue().LeafStoryPlanEstimateTotal || 0;

        col.store.each(function(r){
            var parentRef = r.get('Parent') && r.get('Parent')._ref;
            if (parentRef === thisRef){
                est += r.get('LeafStoryPlanEstimateTotal') || 0;
                storyCount += r.get('LeafStoryCount') || 0;
                epicCount++;
            }
        }, this);

        var text = Ext.String.format("{0} of {1} Total Estimate ({2} Epics)",est, estimateTotal, epicCount);
        return text;
        return Ext.String.format("<span style=\"display:inline-block;color:#222222;font-family:ProximaNovaSemiBold, Helvetica, Arial;border-radius:2px;font-size:11px;background-color:#e6e6e6;padding:3px;margin:2px;text-align:center;\">{0} of {1} Total Estimate ({2} Epics)</span>",est, estimateTotal, epicCount);
    },
    onColumnsUpdated: function() {

        Ext.Array.each(this.columns, function(c,idx){
            var text = this._getCell(c,idx);
            var cell = this.getEl().down('.cell-' + idx);
            if (cell){
                cell.update(text);
            }
        }, this);
    }
});