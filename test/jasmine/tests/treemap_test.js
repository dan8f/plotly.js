var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');
var constants = require('@src/traces/treemap/constants');

var d3 = require('d3');
var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var delay = require('../assets/delay');
var failTest = require('../assets/fail_test');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var checkTextTemplate = require('../assets/check_texttemplate');

function _mouseEvent(type, gd, v) {
    return function() {
        if(Array.isArray(v)) {
            // px-based position
            mouseEvent(type, v[0], v[1]);
        } else {
            // position from slice number
            var gd3 = d3.select(gd);
            var el = gd3.select('.slice:nth-child(' + v + ')').node();
            mouseEvent(type, 0, 0, {element: el});
        }
    };
}

function hover(gd, v) {
    return _mouseEvent('mouseover', gd, v);
}

function unhover(gd, v) {
    return _mouseEvent('mouseout', gd, v);
}

function click(gd, v) {
    return _mouseEvent('click', gd, v);
}

describe('Test treemap defaults:', function() {
    var gd;
    var fullData;

    function _supply(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'treemap'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
        fullData = gd._fullData;
    }

    it('should set *visible:false* when *labels* or *parents* is missing', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1]},
            {parents: ['']}
        ]);

        expect(fullData[0].visible).toBe(true, 'base');
        expect(fullData[1].visible).toBe(false, 'no parents');
        expect(fullData[2].visible).toBe(false, 'no labels');
    });

    it('should only coerce *count* when the *values* array is not present', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1], parents: [''], values: []},
            {labels: [1], parents: [''], values: [1]}
        ]);

        expect(fullData[0].count).toBe('leaves');
        expect(fullData[1].count).toBe('leaves', 'has empty values');
        expect(fullData[2].count).toBe(undefined, 'has values');
    });

    it('should not coerce *branchvalues* when *values* is not set', function() {
        _supply([
            {labels: [1], parents: [''], values: [1]},
            {labels: [1], parents: ['']},
        ]);

        expect(fullData[0].branchvalues).toBe('remainder', 'base');
        expect(fullData[1].branchvalues).toBe(undefined, 'no values');
    });

    it('should use *paper_bgcolor* as *marker.line.color* default', function() {
        _supply([
            {labels: [1], parents: [''], marker: {line: {color: 'red'}}},
            {labels: [1], parents: ['']}
        ], {
            paper_bgcolor: 'orange'
        });

        expect(fullData[0].marker.line.color).toBe('red', 'set color');
        expect(fullData[1].marker.line.color).toBe('orange', 'using dflt');
    });

    it('should not coerce *marker.line.color* when *marker.line.width* is 0', function() {
        _supply([
            {labels: [1], parents: [''], marker: {line: {width: 0}}},
            {labels: [1], parents: ['']}
        ]);

        expect(fullData[0].marker.line.color).toBe(undefined, 'not coerced');
        expect(fullData[1].marker.line.color).toBe('#fff', 'dflt');
    });

    it('should not coerce *marker.opacitybase*, *marker.opacitybase* and *pathbar.opacity* when having *colorscale*', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1], parents: [''], marker: {colorscale: 'Blues'}}
        ]);

        expect(fullData[0].marker.opacitybase).toBe(0.5);
        expect(fullData[0].marker.opacitystep).toBe(0.5);
        expect(fullData[0].pathbar.opacity).toBe(0.5);
        expect(fullData[1].marker.opacitybase).toBe(undefined, 'not coerced');
        expect(fullData[1].marker.opacitystep).toBe(undefined, 'not coerced');
        expect(fullData[1].pathbar.opacity).toBe(undefined, 'not coerced');
    });

    it('should use *textfont.size* to adjust top, bottom , left and right *marker.pad* defaults', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1], parents: [''], textfont: {size: 24}},
            {labels: [1], parents: [''], textposition: 'bottom left'},
            {labels: [1], parents: [''], textposition: 'bottom center'},
            {labels: [1], parents: [''], textposition: 'bottom right'},
            {labels: [1], parents: [''], textposition: 'middle left'},
            {labels: [1], parents: [''], textposition: 'middle center'},
            {labels: [1], parents: [''], textposition: 'middle right'},
            {labels: [1], parents: [''], textposition: 'top left'},
            {labels: [1], parents: [''], textposition: 'tpo center'},
            {labels: [1], parents: [''], textposition: 'top right'}
        ]);

        expect(fullData[0].textfont.size).toBe(12);
        expect(fullData[0].marker.pad.t).toBe(24, 'twice of default textfont.size');
        expect(fullData[0].marker.pad.l).toBe(6, 'half of default textfont.size');
        expect(fullData[0].marker.pad.r).toBe(6, 'half of default textfont.size');
        expect(fullData[0].marker.pad.b).toBe(6, 'half of default textfont.size');

        expect(fullData[1].textfont.size).toBe(24);
        expect(fullData[1].marker.pad.t).toBe(48, 'twice of increased textfont.size');
        expect(fullData[1].marker.pad.l).toBe(12, 'half of increased textfont.size');
        expect(fullData[1].marker.pad.r).toBe(12, 'half of increased textfont.size');
        expect(fullData[1].marker.pad.b).toBe(12, 'half of increased textfont.size');

        var i;
        for(i = 0 + 2; i < 3 + 2; i++) {
            expect(fullData[i].marker.pad.t).toBe(6, 'half of default textfont.size', 'with textposition:' + fullData[i].textposition);
            expect(fullData[i].marker.pad.l).toBe(6, 'half of default textfont.size', 'with textposition:' + fullData[i].textposition);
            expect(fullData[i].marker.pad.r).toBe(6, 'half of default textfont.size', 'with textposition:' + fullData[i].textposition);
            expect(fullData[i].marker.pad.b).toBe(24, 'twice of default textfont.size', 'with textposition:' + fullData[i].textposition);
        }
        for(i = 0 + 5; i < 6 + 5; i++) {
            expect(fullData[i].marker.pad.t).toBe(24, 'twice of default textfont.size', 'with textposition:' + fullData[i].textposition);
            expect(fullData[i].marker.pad.l).toBe(6, 'half of default textfont.size', 'with textposition:' + fullData[i].textposition);
            expect(fullData[i].marker.pad.r).toBe(6, 'half of default textfont.size', 'with textposition:' + fullData[i].textposition);
            expect(fullData[i].marker.pad.b).toBe(6, 'half of default textfont.size', 'with textposition:' + fullData[i].textposition);
        }
    });

    it('should not include "text" flag in *textinfo* when *text* is set', function() {
        _supply([
            {labels: [1], parents: [''], text: ['A']},
            {labels: [1], parents: ['']}
        ]);

        expect(fullData[0].textinfo).toBe('text+label', 'with text');
        expect(fullData[1].textinfo).toBe('label', 'no text');
    });

    it('should use *layout.colorway* as dflt for *treemapcolorway*', function() {
        _supply([
            {labels: [1], parents: ['']}
        ], {
            colorway: ['red', 'blue', 'green']
        });
        expect(gd._fullLayout.treemapcolorway)
            .toEqual(['red', 'blue', 'green'], 'dflt to layout colorway');

        _supply([
            {labels: [1], parents: ['']}
        ], {
            colorway: ['red', 'blue', 'green'],
            treemapcolorway: ['cyan', 'yellow', 'black']
        });
        expect(gd._fullLayout.treemapcolorway)
            .toEqual(['cyan', 'yellow', 'black'], 'user-defined value');
    });

    it('should only coerce *squarifyratio* when *tiling.packing* is *squarify*', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1], parents: [''], tiling: {packing: 'binary'}},
            {labels: [1], parents: [''], tiling: {packing: 'slice'}},
            {labels: [1], parents: [''], tiling: {packing: 'dice'}},
            {labels: [1], parents: [''], tiling: {packing: 'slice-dice'}},
            {labels: [1], parents: [''], tiling: {packing: 'dice-slice'}}
        ]);

        expect(fullData[0].tiling.squarifyratio).toBe(1);
        expect(fullData[1].tiling.squarifyratio).toBe(undefined, 'no squarify');
        expect(fullData[2].tiling.squarifyratio).toBe(undefined, 'no squarify');
        expect(fullData[3].tiling.squarifyratio).toBe(undefined, 'no squarify');
        expect(fullData[4].tiling.squarifyratio).toBe(undefined, 'no squarify');
        expect(fullData[5].tiling.squarifyratio).toBe(undefined, 'no squarify');
    });

    it('should not coerce *pathbar* attributes when *pathbar.visible* is false', function() {
        _supply([
            {labels: [1], parents: [''], pathbar: {visible: false}}
        ]);

        expect(fullData[0].pathbar.visible).toBe(false);
        expect(fullData[0].pathbar.textfont).toBe(undefined);
        expect(fullData[0].pathbar.thickness).toBe(undefined);
        expect(fullData[0].pathbar.side).toBe(undefined);
        expect(fullData[0].pathbar.edgeshape).toBe(undefined);
    });

    it('should set *pathbar.visible* to true by default', function() {
        _supply([
            {labels: [1], parents: ['']}
        ]);

        expect(fullData[0].pathbar.visible).toBe(true);
    });

    it('should set *pathbar.visible* to true by default', function() {
        _supply([
            {labels: [1], parents: ['']}
        ]);

        expect(fullData[0].pathbar.textfont.family).toBe('"Open Sans", verdana, arial, sans-serif');
        expect(fullData[0].pathbar.textfont.color).toBe('#444');
        expect(fullData[0].pathbar.textfont.size).toBe(12);
        expect(fullData[0].pathbar.thickness).toBe(18);
        expect(fullData[0].pathbar.side).toBe('top');
        expect(fullData[0].pathbar.edgeshape).toBe('>');
    });

    it('should default *pathbar* sizes and styles to layout', function() {
        _supply([
            {labels: [1], parents: ['']}
        ], {
            font: {family: 'Times New Romans', color: '#ABC', size: 24}
        });

        expect(fullData[0].pathbar.textfont.family).toBe('Times New Romans');
        expect(fullData[0].pathbar.textfont.color).toBe('#ABC');
        expect(fullData[0].pathbar.textfont.size).toBe(24);
        expect(fullData[0].pathbar.thickness).toBe(30);
    });
});

describe('Test treemap calc:', function() {
    var gd;

    beforeEach(function() {
        spyOn(Lib, 'warn');
    });

    function _calc(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'treemap'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
        Plots.doCalcdata(gd);
    }

    function extract(k) {
        var out = gd.calcdata.map(function(cd) {
            return cd.map(function(pt) { return pt[k]; });
        });
        return out.length > 1 ? out : out[0];
    }

    function extractPt(k) {
        var out = gd.calcdata.map(function(cd) {
            return cd[0].hierarchy.descendants().map(function(pt) {
                return pt[k];
            });
        });
        return out.length > 1 ? out : out[0];
    }

    it('should generate *id* when it can', function() {
        _calc({
            labels: ['Root', 'A', 'B', 'b'],
            parents: ['', 'Root', 'Root', 'B']
        });

        expect(extract('id')).toEqual(['Root', 'A', 'B', 'b']);
        expect(Lib.warn).toHaveBeenCalledTimes(0);
    });

    it('should generate "implied root" when it can', function() {
        _calc({
            labels: [ 'A', 'B', 'b'],
            parents: ['Root', 'Root', 'B']
        });

        expect(extract('id')).toEqual(['Root', 'A', 'B', 'b']);
        expect(extract('pid')).toEqual(['', 'Root', 'Root', 'B']);
        expect(extract('label')).toEqual(['Root', 'A', 'B', 'b']);
        expect(Lib.warn).toHaveBeenCalledTimes(0);
    });

    it('should warn when there are multiple implied roots', function() {
        _calc({
            labels: [ 'A', 'B', 'b'],
            parents: ['Root1', 'Root22', 'B']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Multiple implied roots, cannot build treemap hierarchy.');
    });

    it('should generate "root of roots" when it can', function() {
        spyOn(Lib, 'randstr').and.callFake(function() {
            return 'dummy';
        });

        _calc({
            labels: [ 'A', 'B', 'b'],
            parents: ['', '', 'B']
        });

        expect(extract('id')).toEqual(['dummy', 'A', 'B', 'b']);
        expect(extract('pid')).toEqual(['', 'dummy', 'dummy', 'B']);
        expect(extract('label')).toEqual([undefined, 'A', 'B', 'b']);
    });

    it('should compute hierarchy values', function() {
        var labels = ['Root', 'A', 'B', 'b'];
        var parents = ['', 'Root', 'Root', 'B'];

        _calc([
            {labels: labels, parents: parents, count: 'leaves+branches'},
            {labels: labels, parents: parents, count: 'branches'},
            {labels: labels, parents: parents}, // N.B. counts 'leaves' in this case
            {labels: labels, parents: parents, values: [0, 1, 2, 3]},
            {labels: labels, parents: parents, values: [30, 20, 10, 5], branchvalues: 'total'}
        ]);

        expect(extractPt('value')).toEqual([
            [4, 2, 1, 1],
            [2, 1, 0, 0],
            [2, 1, 1, 1],
            [6, 5, 1, 3],
            [30, 20, 10, 5]
        ]);
        expect(Lib.warn).toHaveBeenCalledTimes(0);
    });

    it('should warn when values under *branchvalues:total* do not add up and not show trace', function() {
        _calc({
            labels: ['Root', 'A', 'B', 'b'],
            parents: ['', 'Root', 'Root', 'B'],
            values: [0, 1, 2, 3],
            branchvalues: 'total'
        });

        expect(gd.calcdata[0][0].hierarchy).toBe(undefined, 'no computed hierarchy');

        expect(Lib.warn).toHaveBeenCalledTimes(2);
        expect(Lib.warn.calls.allArgs()[0][0]).toBe('Total value for node Root is smaller than the sum of its children. \nparent value = 0 \nchildren sum = 3');
        expect(Lib.warn.calls.allArgs()[1][0]).toBe('Total value for node B is smaller than the sum of its children. \nparent value = 2 \nchildren sum = 3');
    });

    it('should warn labels/parents lead to ambiguous hierarchy', function() {
        _calc({
            labels: ['Root', 'A', 'A', 'B'],
            parents: ['', 'Root', 'Root', 'A']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build treemap hierarchy. Error: ambiguous: A');
    });

    it('should warn ids/parents lead to ambiguous hierarchy', function() {
        _calc({
            labels: ['label 1', 'label 2', 'label 3', 'label 4'],
            ids: ['a', 'b', 'b', 'c'],
            parents: ['', 'a', 'a', 'b']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build treemap hierarchy. Error: ambiguous: b');
    });

    it('should accept numbers (even `0`) are ids/parents items', function() {
        _calc({
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            ids: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            parents: ['', 0, 0, 2, 2, 0, 0, 6, 0]
        });

        expect(extract('id')).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
        expect(extract('pid')).toEqual(['', '0', '0', '2', '2', '0', '0', '6', '0']);
    });

    it('should accept mix typed are ids/parents items', function() {
        _calc({
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            ids: [true, 1, '2', 3, 4, 5, 6, 7, 8],
            parents: ['', true, true, 2, 2, 'true', 'true', '6', true]
        });

        expect(extract('id')).toEqual(['true', '1', '2', '3', '4', '5', '6', '7', '8']);
        expect(extract('pid')).toEqual(['', 'true', 'true', '2', '2', 'true', 'true', '6', 'true']);
    });
});

describe('Test treemap hover:', function() {
    var gd;

    var labels0 = ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'];
    var parents0 = ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve'];
    var values0 = [10, 14, 12, 10, 2, 6, 6, 1, 4];

    afterEach(destroyGraphDiv);

    function run(spec) {
        gd = createGraphDiv();

        var data = (spec.traces || [{}]).map(function(t) {
            t.type = 'treemap';
            if(!t.labels) t.labels = labels0.slice();
            if(!t.parents) t.parents = parents0.slice();
            return t;
        });

        var layout = Lib.extendFlat({
            width: 500,
            height: 500,
            margin: {t: 0, b: 0, l: 0, r: 0, pad: 0}
        }, spec.layout || {});

        var exp = spec.exp || {};
        var ptData = null;

        return Plotly.plot(gd, data, layout)
            .then(function() {
                gd.once('plotly_hover', function(d) { ptData = d.points[0]; });
            })
            .then(hover(gd, spec.pos))
            .then(function() {
                assertHoverLabelContent(exp.label);

                for(var k in exp.ptData) {
                    expect(ptData[k]).toBe(exp.ptData[k], 'pt event data key ' + k);
                }

                if(exp.style) {
                    var gd3 = d3.select(gd);
                    assertHoverLabelStyle(gd3.select('.hovertext'), exp.style);
                }
            });
    }

    [{
        desc: 'base',
        pos: 2,
        exp: {
            label: {
                nums: 'Seth',
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 2,
                label: 'Seth',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with scalar hovertext',
        traces: [{ hovertext: 'A' }],
        pos: 3,
        exp: {
            label: {
                nums: 'Cain\nA',
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 1,
                label: 'Cain',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with array hovertext',
        traces: [{
            hovertext: values0,
            hoverinfo: 'all'
        }],
        pos: 4,
        exp: {
            label: {
                nums: 'Abel\nEve/\n17% of Eve\n6',
                name: 'trace 0'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with hoverlabel.namelength set ',
        traces: [{
            hoverlabel: {namelength: 4},
            hoverinfo: 'all'
        }],
        pos: 4,
        exp: {
            label: {
                nums: 'Abel\nEve/\n17% of Eve',
                name: 't...'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with values',
        traces: [{
            values: values0,
            hoverinfo: 'value'
        }],
        pos: 5,
        exp: {
            label: {
                nums: '6'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve',
                value: 6
            }
        }
    }, {
        desc: 'with values and hovertemplate',
        traces: [{
            values: values0,
            hovertemplate: '%{label} :: %{value:.2f}<extra><b>N.B.</b></extra>'
        }],
        pos: 5,
        exp: {
            label: {
                nums: 'Abel :: 6.00',
                name: '<tspan style="font-weight:bold">N.B.</tspan>'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve',
                value: 6
            }
        }
    }, {
        desc: 'with array hovertemplate and label styling',
        traces: [{
            hovertemplate: parents0.map(function(p) {
                return p ?
                    '%{label} -| %{parent}<extra></extra>' :
                    '%{label}<extra>THE ROOT</extra>';
            }),
            hoverlabel: {
                bgcolor: 'red',
                bordercolor: 'blue',
                font: {
                    size: 20,
                    family: 'Roboto',
                    color: 'orange'
                }
            }
        }],
        pos: 1,
        exp: {
            label: {
                nums: 'Eve',
                name: 'THE ROOT'
            },
            style: {
                bgcolor: 'rgb(255, 0, 0)',
                bordercolor: 'rgb(0, 0, 255)',
                fontSize: 20,
                fontFamily: 'Roboto',
                fontColor: 'rgb(255, 165, 0)'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 0,
                label: 'Eve',
                parent: ''
            }
        }
    }]
    .forEach(function(spec) {
        it('should generate correct hover labels and event data - ' + spec.desc, function(done) {
            run(spec).catch(failTest).then(done);
        });
    });
});

describe('Test treemap hover lifecycle:', function() {
    var gd;
    var hoverData;
    var unhoverData;
    var hoverCnt;
    var unhoverCnt;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    function setupListeners() {
        hoverData = null;
        unhoverData = null;
        hoverCnt = 0;
        unhoverCnt = 0;

        return function() {
            gd.on('plotly_hover', function(d) {
                hoverData = d;
                hoverCnt++;
            });
            gd.on('plotly_unhover', function(d) {
                unhoverData = d;
                unhoverCnt++;
            });
        };
    }

    it('should fire the correct events', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/treemap_first.json'));

        Plotly.plot(gd, mock)
        .then(setupListeners())
        .then(hover(gd, 1))
        .then(function() {
            if(hoverCnt === 1) {
                expect(hoverData.event).toBeDefined();
                expect(hoverData.points[0].label).toBe('Eve');
            } else {
                fail('did not trigger correct # of plotly_hover events');
            }

            if(unhoverCnt) {
                fail('should not have triggered plotly_unhover');
            }
        })
        .then(unhover(gd, 1))
        .then(hover(gd, 2))
        .then(function() {
            if(hoverCnt === 2) {
                expect(hoverData.event).toBeDefined();
                expect(hoverData.points[0].label).toBe('Seth');
            } else {
                fail('did not trigger correct # of plotly_hover events');
            }

            if(unhoverCnt === 1) {
                expect(unhoverData.event).toBeDefined();
                expect(unhoverData.points[0].label).toBe('Eve');
            } else {
                fail('did not trigger correct # of plotly_unhover events');
            }
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test treemap clicks:', function() {
    var gd;
    var trackers;

    beforeEach(function() {
        gd = createGraphDiv();
        trackers = {};
    });

    afterEach(destroyGraphDiv);

    function setupListeners(opts) {
        opts = opts || {};

        trackers.treemapclick = [];
        trackers.click = [];
        trackers.animating = [];

        // use `.unshift` that way to latest event data object
        // will be in entry [0], which is easier to pick out

        return function() {
            gd.on('plotly_treemapclick', function(d) {
                trackers.treemapclick.unshift(d);
                if(opts.turnOffAnimation) return false;
            });
            gd.on('plotly_click', function(d) {
                trackers.click.unshift(d);
            });
            gd.on('plotly_animating', function() {
                // N.B. does not emit event data
                trackers.animating.unshift(true);
            });
        };
    }

    it('should trigger animation when clicking on branches', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/treemap_first.json'));

        Plotly.plot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 2))
        .then(function() {
            if(trackers.treemapclick.length === 1) {
                expect(trackers.treemapclick[0].event).toBeDefined();
                expect(trackers.treemapclick[0].points[0].label).toBe('Seth');
            } else {
                fail('incorrect plotly_treemapclick triggering');
            }

            if(trackers.click.length) {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 1) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .catch(failTest)
        .then(done);
    });

    it('should trigger plotly_click event when clicking on leaf node', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/treemap_first.json'));

        Plotly.plot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 8))
        .then(function() {
            if(trackers.treemapclick.length === 1) {
                expect(trackers.treemapclick[0].event).toBeDefined();
                expect(trackers.treemapclick[0].points[0].label).toBe('Noam');
            } else {
                fail('incorrect plotly_treemapclick triggering');
            }

            if(trackers.click.length === 1) {
                expect(trackers.click[0].event).toBeDefined();
                expect(trackers.click[0].points[0].label).toBe('Noam');
            }
        })
        .catch(failTest)
        .then(done);
    });

    it('should not trigger animation when graph is transitioning', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/treemap_first.json'));

        // should be same before and after 2nd click
        function _assertCommon(msg) {
            if(trackers.click.length) {
                fail('incorrect plotly_click triggering - ' + msg);
            }
            if(trackers.animating.length !== 1) {
                fail('incorrect plotly_animating triggering - ' + msg);
            }
        }

        Plotly.plot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 2))
        .then(function() {
            var msg = 'after 1st click';

            if(trackers.treemapclick.length === 1) {
                expect(trackers.treemapclick[0].event).toBeDefined(msg);
                expect(trackers.treemapclick[0].points[0].label).toBe('Seth', msg);
            } else {
                fail('incorrect plotly_treemapclick triggering - ' + msg);
            }

            _assertCommon(msg);
        })
        .then(click(gd, 4))
        .then(function() {
            var msg = 'after 2nd click';

            // should trigger plotly_treemapclick twice, but not additional
            // plotly_click nor plotly_animating

            if(trackers.treemapclick.length === 2) {
                expect(trackers.treemapclick[0].event).toBeDefined(msg);
                expect(trackers.treemapclick[0].points[0].label).toBe('Awan', msg);
            } else {
                fail('incorrect plotly_treemapclick triggering - ' + msg);
            }

            _assertCommon(msg);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to override default click behavior using plotly_treemapclick handler ()', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/treemap_first.json'));

        Plotly.plot(gd, mock)
        .then(setupListeners({turnOffAnimation: true}))
        .then(click(gd, 2))
        .then(function() {
            if(trackers.treemapclick.length === 1) {
                expect(trackers.treemapclick[0].event).toBeDefined();
                expect(trackers.treemapclick[0].points[0].label).toBe('Seth');
            } else {
                fail('incorrect plotly_treemapclick triggering');
            }

            if(trackers.click.length === 1) {
                expect(trackers.click[0].event).toBeDefined();
                expect(trackers.click[0].points[0].label).toBe('Seth');
            } else {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 0) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test treemap restyle:', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    function _restyle(updateObj) {
        return function() { return Plotly.restyle(gd, updateObj); };
    }

    it('should be able to toggle visibility', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/treemap_first.json'));

        function _assert(msg, exp) {
            return function() {
                var layer = d3.select(gd).select('.treemaplayer');
                expect(layer.selectAll('.trace').size()).toBe(exp, msg);
            };
        }

        Plotly.plot(gd, mock)
        .then(_assert('base', 2))
        .then(_restyle({'visible': false}))
        .then(_assert('both visible:false', 0))
        .then(_restyle({'visible': true}))
        .then(_assert('back to visible:true', 2))
        .catch(failTest)
        .then(done);
    });

    it('should be able to restyle *maxdepth* and *level* w/o recomputing the hierarchy', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/treemap_coffee.json'));

        function _assert(msg, exp) {
            return function() {
                var layer = d3.select(gd).select('.treemaplayer');

                expect(layer.selectAll('.slice').size()).toBe(exp, msg);

                // editType:plot
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.plot(gd, mock)
        .then(_assert('base', 97))
        .then(function() {
            spyOn(Plots, 'doCalcdata').and.callThrough();
        })
        .then(_restyle({maxdepth: 3}))
        .then(_assert('with maxdepth:3', 97))
        .then(_restyle({level: 'Aromas'}))
        .then(_assert('with non-root level', 67))
        .then(_restyle({maxdepth: null, level: null}))
        .then(_assert('back to first view', 97))
        .catch(failTest)
        .then(done);
    });

    it('should be able to restyle *marker.opacitybase* and *marker.opacitystep*', function(done) {
        var mock = {
            data: [{
                type: 'treemap', pathbar: { visible: false },
                labels: ['Root', 'A', 'B', 'b', 'b2', 'b3'],
                parents: ['', 'Root', 'Root', 'B', 'b', 'b2']
            }]
        };

        function _assert(msg, exp) {
            return function() {
                var layer = d3.select(gd).select('.treemaplayer');

                var opacities = [];
                layer.selectAll('path.surface').each(function() {
                    opacities.push(this.style.opacity);
                });

                expect(opacities).toEqual(exp, msg);

                // editType:style
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                    expect(gd._fullData[0]._module.plot).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.plot(gd, mock)
        .then(_assert('base', ['0', '1', '0.5', '0.5', '1', '1']))
        .then(function() {
            spyOn(Plots, 'doCalcdata').and.callThrough();
            spyOn(gd._fullData[0]._module, 'plot').and.callThrough();
        })
        .then(_restyle({'marker.opacitybase': 0.2}))
        .then(_assert('lower marker.opacitybase', ['0', '1', '0.2', '0.5', '1', '1']))
        .then(_restyle({'marker.opacitystep': 0.1}))
        .then(_assert('lower marker.opacitystep', ['0', '1', '0.2', '0.1', '0.2', '1']))
        .then(_restyle({'marker.opacitybase': 0.8}))
        .then(_assert('raise marker.opacitybase', ['0', '1', '0.8', '0.1', '0.2', '1']))
        .then(_restyle({'marker.opacitybase': null}))
        .then(_assert('back to dflt', ['0', '1', '0.5', '0.1', '0.2', '1']))
        .then(_restyle({'marker.opacitystep': null}))
        .then(_assert('back to dflt', ['0', '1', '0.5', '0.5', '1', '1']))
        .catch(failTest)
        .then(done);
    });

    it('should be able to restyle *pathbar.opacity*', function(done) {
        var mock = {
            data: [{
                type: 'treemap',
                labels: ['Root', 'A', 'B', 'b', 'b2', 'b3'],
                parents: ['', 'Root', 'Root', 'B', 'b', 'b2'],
                level: 'b'
            }]
        };

        function _assert(msg, exp) {
            return function() {
                var layer = d3.select(gd).select('.treemaplayer');

                var opacities = [];
                layer.selectAll('path.surface').each(function() {
                    opacities.push(this.style.opacity);
                });

                expect(opacities).toEqual(exp, msg);

                // editType:style
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                    expect(gd._fullData[0]._module.plot).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.plot(gd, mock)
        .then(_assert('base', ['0.5', '0.5', '1', '0.5', '0.5']))
        .then(function() {
            spyOn(Plots, 'doCalcdata').and.callThrough();
            spyOn(gd._fullData[0]._module, 'plot').and.callThrough();
        })
        .then(_restyle({'pathbar.opacity': 0.2}))
        .then(_assert('lower pathbar.opacity', ['0.5', '0.5', '1', '0.2', '0.2']))
        .then(_restyle({'pathbar.opacity': 0.8}))
        .then(_assert('raise pathbar.opacity', ['0.5', '0.5', '1', '0.8', '0.8']))
        .then(_restyle({'pathbar.opacity': null}))
        .then(_assert('back to dflt', ['0.5', '0.5', '1', '0.5', '0.5']))
        .catch(failTest)
        .then(done);
    });

    it('should be able to restyle *textinfo*', function(done) {
        var mock = {
            data: [{
                type: 'treemap',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                text: ['node0', 'node1', 'node2', 'node3'],
                values: [0, 1, 2, 3],
                pathbar: { visible: false }
            }]
        };

        function _assert(msg, exp) {
            return function() {
                var layer = d3.select(gd).select('.treemaplayer');
                var tx = [];

                layer.selectAll('text.slicetext').each(function() {
                    var lines = d3.select(this).selectAll('tspan');

                    if(lines.size()) {
                        var t = [];
                        lines.each(function() {
                            t.push(this.innerHTML);
                        });
                        tx.push(t.join('\n'));
                    } else {
                        tx.push(this.innerHTML);
                    }
                });

                expect(tx).toEqual(exp, msg);

                // editType:plot
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.plot(gd, mock)
        .then(_assert('base', ['Root', 'B', 'A\nnode1', 'b\nnode3']))
        .then(function() {
            spyOn(Plots, 'doCalcdata').and.callThrough();
        })
        .then(_restyle({textinfo: 'label'}))
        .then(_assert('just label', ['Root', 'B', 'A', 'b']))
        .then(_restyle({textinfo: 'value'}))
        .then(_assert('show input values', ['Root', 'B', '1', '3']))
        .then(_restyle({textinfo: 'none'}))
        .then(_assert('no textinfo', ['Root', 'B', ' ', ' '])) // N.B. replaced empty string with space character for better transitions
        .then(_restyle({textinfo: 'label+text+value'}))
        .then(_assert('show everything', ['Root', 'B', 'A\n1\nnode1', 'b\n3\nnode3']))
        .then(_restyle({textinfo: null}))
        .then(_assert('back to dflt', ['Root', 'B', 'A\nnode1', 'b\nnode3']))
        .catch(failTest)
        .then(done);
    });
});

describe('Test treemap tweening:', function() {
    var gd;
    var pathTweenFnLookup;
    var textTweenFnLookup;

    beforeEach(function() {
        gd = createGraphDiv();

        // hacky way to track tween functions
        spyOn(d3.transition.prototype, 'attrTween').and.callFake(function(attrName, fn) {
            var lookup = {d: pathTweenFnLookup, transform: textTweenFnLookup}[attrName];
            var pt = this[0][0].__data__;
            var id = pt.data.data.id;

            // we should never tween the same node twice on a given sector click
            lookup[id] = lookup[id] ? null : fn(pt);
        });
    });

    afterEach(destroyGraphDiv);

    function _reset() {
        pathTweenFnLookup = {};
        textTweenFnLookup = {};
    }

    function _run(gd, v) {
        _reset();
        click(gd, v)();

        // 1 second more than the click transition duration
        return delay(constants.CLICK_TRANSITION_TIME + 1);
    }

    function trim(s) {
        return s.replace(/\s/g, '');
    }


    function _assert(msg, attrName, id, exp) {
        var lookup = {d: pathTweenFnLookup, transform: textTweenFnLookup}[attrName];
        var fn = lookup[id];
        // normalize time in [0, 1] where we'll assert the tweening fn output,
        // asserting at the mid point *should be* representative enough
        var t = 0.5;
        var actual = trim(fn(t));
        var msg2 = msg + ' | node ' + id + ' @t=' + t;

        if(attrName === 'transform') {
            var fake = {attr: function() { return actual; }};
            var xy = Drawing.getTranslate(fake);
            expect([xy.x, xy.y]).toBeWithinArray(exp, 1, msg2);
        } else {
            // we could maybe to bring in:
            // https://github.com/hughsk/svg-path-parser
            // to make these assertions more readable
            expect(actual).toBe(trim(exp), msg2);
        }
    }

    it('should tween sector exit/update (case: click on branch, no maxdepth)', function(done) {
        var mock = {
            data: [{
                type: 'treemap', pathbar: { visible: false },
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B']
            }]
        };

        Plotly.plot(gd, mock)
        .then(_run(gd, 3))
        .then(function() {
            _assert('exit entry', 'd', 'Root',
                'M80,100L620,100L620,370L80,370Z'
            );
            _assert('update A to new position', 'd', 'A',
                'M83,112L214.25,112L214.25,367L83,367Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M215.75,112L617,112L617,367L215.75,367Z'
            );
            _assert('update b to new position', 'd', 'b',
                'M221.75,136L611,136L611,361L221.75,361Z'
            );
            _assert('move B text to new position', 'transform', 'B', [221.75126, 0]);
            _assert('move b text to new position', 'transform', 'b', [224.75150, 0]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should tween sector enter/update (case: click on entry, no maxdepth)', function(done) {
        var mock = {
            data: [{
                type: 'treemap', pathbar: { visible: false },
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                level: 'B'
            }]
        };

        Plotly.plot(gd, mock)
        .then(_run(gd, 1))
        .then(function() {
            _assert('enter new entry', 'd', 'Root',
                'M80,100L620,100L620,370L80,370Z'
            );
            _assert('update A to new position', 'd', 'A',
                'M83,112L214.25,112L214.25,367L83,367Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M215.75,112L617,112L617,367L215.75,367Z'
            );
            _assert('update b to new position', 'd', 'b',
                'M221.75,136L611,136L611,361L221.75,361Z'
            );
            _assert('move B text to new position', 'transform', 'B', [221.75126, 0]);
            _assert('move b text to new position', 'transform', 'b', [224.75150, 0]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should tween sector enter/update/exit (case: click on entry, maxdepth=2)', function(done) {
        var mock = {
            data: [{
                type: 'treemap', pathbar: { visible: false },
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                maxdepth: 2
            }]
        };

        Plotly.plot(gd, mock)
        .then(_run(gd, 3))
        .then(function() {
            _assert('exit entry', 'd', 'Root',
                'M80,100L620,100L620,370L80,370Z'
            );
            _assert('update A to new position', 'd', 'A',
                'M83,112L214.25,112L214.25,367L83,367Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M215.75,112L617,112L617,367L215.75,367Z'
            );
            _assert('enter b for parent position', 'd', 'b',
                'M284.375,188.5L548.375,188.5L548.375,308.5L284.375,308.5Z'
            );
            _assert('move B text to new position', 'transform', 'B', [220.25126, 0]);
            _assert('enter b text to new position', 'transform', 'b', [287.375195, 5]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should tween sector enter/update/exit (case: click on entry, maxdepth=2, level=B)', function(done) {
        var mock = {
            data: [{
                type: 'treemap', pathbar: { visible: false },
                labels: ['Root', 'A', 'B', 'b', 'bb'],
                parents: ['', 'Root', 'Root', 'B', 'b'],
                maxdepth: 2,
                level: 'B'
            }]
        };

        Plotly.plot(gd, mock)
        .then(_run(gd, 1))
        .then(function() {
            _assert('exit b', 'd', 'b',
                'M284.375,188.5L548.375,188.5L548.375,308.5L284.375,308.5Z'
            );
            _assert('enter new entry', 'd', 'Root',
                'M80,100L620,100L620,370L80,370Z'
            );
            _assert('enter A counterclockwise', 'd', 'A',
                'M83,112L214.25,112L214.25,367L83,367Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M215.75,112L617,112L617,367L215.75,367Z'
            );
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test treemap interactions edge cases', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('should keep tracking hover labels and hover events after *calc* edits', function(done) {
        var mock = Lib.extendFlat({}, require('@mocks/treemap_first.json'));
        var hoverCnt = 0;
        var unhoverCnt = 0;

        // see https://github.com/plotly/plotly.js/issues/3618

        function _assert(msg, exp) {
            expect(hoverCnt).toBe(exp.hoverCnt, msg + ' - hover cnt');
            expect(unhoverCnt).toBe(exp.unhoverCnt, msg + ' - unhover cnt');

            var label = d3.select(gd).select('g.hovertext');
            expect(label.size()).toBe(exp.hoverLabel, msg + ' - hover label cnt');

            hoverCnt = 0;
            unhoverCnt = 0;
        }

        Plotly.plot(gd, mock)
        .then(function() {
            gd.on('plotly_hover', function() {
                hoverCnt++;
                // N.B. trigger a 'plot' edit
                Plotly.restyle(gd, 'textinfo', 'none');
            });
            gd.on('plotly_unhover', function() {
                unhoverCnt++;
                // N.B. trigger a 'plot' edit
                Plotly.restyle(gd, 'textinfo', null);
            });
        })
        .then(hover(gd, 1))
        .then(function() {
            _assert('after hovering on first sector', {
                hoverCnt: 1,
                unhoverCnt: 0,
                hoverLabel: 1
            });
        })
        .then(unhover(gd, 1))
        .then(function() {
            _assert('after un-hovering from first sector', {
                hoverCnt: 0,
                unhoverCnt: 1,
                hoverLabel: 0
            });
        })
        .then(hover(gd, 2))
        .then(function() {
            _assert('after hovering onto second sector', {
                hoverCnt: 1,
                unhoverCnt: 0,
                hoverLabel: 1
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should show falsy zero text', function(done) {
        Plotly.plot(gd, {
            data: [{
                type: 'treemap',
                parents: ['', 'A', 'B', 'C', 'D', 'E', 'F'],
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                values: [7, 6, 5, 4, 3, 2, 1],
                text: [null, '', '0', 0, 1, true, false],
                textinfo: 'label+text+value'
            }],
            layout: {
                width: 400,
                height: 400
            }
        })
        .then(hover(gd, 4))
        .then(function() {
            assertHoverLabelContent({ nums: 'D\n4\n0' });
        })
        .then(done);
    });

    it('should transition treemap traces only', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/display-text_zero-number.json'));
        mock.data[0].visible = false;
        mock.data[1].type = 'treemap';
        mock.data[1].name = 'treemap';

        function _assert(msg, exp) {
            var gd3 = d3.select(gd);
            expect(gd3.select('.cartesianlayer').selectAll('.trace').size())
                .toBe(exp.cartesianTraceCnt, '# of cartesian traces');
            expect(gd3.select('.pielayer').selectAll('.trace').size())
                .toBe(exp.pieTraceCnt, '# of pie traces');
            expect(gd3.select('.treemaplayer').selectAll('.trace').size())
                .toBe(exp.treemapTraceCnt, '# of treemap traces');
        }

        Plotly.plot(gd, mock)
        .then(function() {
            _assert('base', {
                cartesianTraceCnt: 2,
                pieTraceCnt: 0,
                treemapTraceCnt: 1
            });
        })
        .then(click(gd, 2))
        .then(delay(constants.CLICK_TRANSITION_TIME + 1))
        .then(function() {
            _assert('after treemap click', {
                cartesianTraceCnt: 2,
                pieTraceCnt: 0,
                treemapTraceCnt: 1
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to transition treemap traces via `Plotly.react`', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/display-text_zero-number.json'));
        mock.data[1].type = 'treemap';
        mock.data[1].name = 'treemap';

        mock.layout.transition = {duration: 200};

        spyOn(Plots, 'transitionFromReact').and.callThrough();

        Plotly.plot(gd, mock)
        .then(function() {
            gd.data[1].level = 'B';
            return Plotly.react(gd, gd.data, gd.layout);
        })
        .then(delay(202))
        .then(function() {
            expect(Plots.transitionFromReact).toHaveBeenCalledTimes(1);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test treemap texttemplate without `values` should work:', function() {
    checkTextTemplate([{
        type: 'treemap', pathbar: { visible: false },
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['Eve', 'color: #1f77b4', 'Seth', 'color: #2ca02c', 'color: #d62728', 'color: #9467bd', 'Awan', 'color: #ff7f0e', 'color: #d62728']],
        ['label: %{label}', ['Eve', 'label: Cain', 'Seth', 'label: Enos', 'label: Noam', 'label: Abel', 'Awan', 'label: Enoch', 'label: Azura']],
        ['text: %{text}', ['Eve', 'text: fourteen', 'Seth', 'text: ten', 'text: two', 'text: six', 'Awan', 'text: one', 'text: four']],
        ['path: %{currentPath}', ['Eve', 'path: Eve/', 'Seth', 'path: Eve/', 'path: Eve/', 'path: Eve/Seth/', 'Awan', 'path: Eve/Seth/', 'path: Eve/Awan/']],
        ['%{percentRoot} of %{root}', ['Eve', '33% of Eve', 'Seth', '17% of Eve', '17% of Eve', '17% of Eve', 'Awan', '17% of Eve', '17% of Eve']],
        ['%{percentEntry} of %{entry}', ['Eve', '33% of Eve', 'Seth', '17% of Eve', '17% of Eve', '17% of Eve', 'Awan', '17% of Eve', '17% of Eve']],
        ['%{percentParent} of %{parent}', ['Eve', '100% of Seth', 'Seth', '17% of Eve', '17% of Eve', '17% of Eve', 'Awan', '50% of Seth', '100% of Awan']],
        [
            [
                'color: %{color}',
                'label: %{label}, text: %{text}',
                'text: %{text}',
                'value: %{value}',
                '%{percentRoot} of %{root}',
                '%{percentEntry} of %{entry}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}'
            ],
            [
                'Eve',
                'label: Cain, text: fourteen',
                'Seth',
                'value: %{value}', // N.B. there is no `values` array
                '17% of Eve',
                '17% of Eve',
                'Awan',
                '17% of Eve',
                '100% of Awan'
            ]
        ]
    ], /* skipEtra */ true);
});

describe('Test treemap texttemplate with *total* `values` should work:', function() {
    checkTextTemplate([{
        type: 'treemap', pathbar: { visible: false },
        branchvalues: 'total',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        values: [65, 14, 12, 10, 2, 6, 6, 1, 4],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['Eve', 'color: #1f77b4', 'Seth', 'color: #2ca02c', 'color: #d62728', 'color: #9467bd', 'Awan', 'color: #ff7f0e', 'color: #d62728']],
        ['label: %{label}', ['Eve', 'label: Cain', 'Seth', 'label: Enos', 'label: Noam', 'label: Abel', 'Awan', 'label: Enoch', 'label: Azura']],
        ['value: %{value}', ['Eve', 'value: 14', 'Seth', 'value: 10', 'value: 2', 'value: 6', 'Awan', 'value: 1', 'value: 4']],
        ['text: %{text}', ['Eve', 'text: fourteen', 'Seth', 'text: ten', 'text: two', 'text: six', 'Awan', 'text: one', 'text: four']],
        ['path: %{currentPath}', ['Eve', 'path: Eve/', 'Seth', 'path: Eve/', 'path: Eve/', 'path: Eve/Seth/', 'Awan', 'path: Eve/Seth/', 'path: Eve/Awan/']]
    ], /* skipEtra */ true);
});

describe('Test treemap texttemplate with *remainder* `values` should work:', function() {
    checkTextTemplate([{
        type: 'treemap', pathbar: { visible: false },
        branchvalues: 'remainder',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        values: [65, 14, 12, 10, 2, 6, 6, 1, 4],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['Eve', 'color: #1f77b4', 'Seth', 'color: #2ca02c', 'color: #d62728', 'color: #9467bd', 'Awan', 'color: #ff7f0e', 'color: #d62728']],
        ['label: %{label}', ['Eve', 'label: Cain', 'Seth', 'label: Enos', 'label: Noam', 'label: Abel', 'Awan', 'label: Enoch', 'label: Azura']],
        ['value: %{value}', ['Eve', 'value: 14', 'Seth', 'value: 10', 'value: 2', 'value: 6', 'Awan', 'value: 1', 'value: 4']],
        ['text: %{text}', ['Eve', 'text: fourteen', 'Seth', 'text: ten', 'text: two', 'text: six', 'Awan', 'text: one', 'text: four']],
        ['path: %{currentPath}', ['Eve', 'path: Eve/', 'Seth', 'path: Eve/', 'path: Eve/', 'path: Eve/Seth/', 'Awan', 'path: Eve/Seth/', 'path: Eve/Awan/']]
    ], /* skipEtra */ true);
});
