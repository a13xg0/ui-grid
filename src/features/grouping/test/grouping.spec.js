describe('ui.grid.grouping uiGridGroupingService', function () {
  var uiGridGroupingService;
  var uiGridGroupingConstants;
  var gridClassFactory;
  var grid;
  var $rootScope;
  var $scope;
  var GridRow;

  beforeEach(module('ui.grid.grouping'));

  beforeEach(inject(function (_uiGridGroupingService_,_gridClassFactory_, $templateCache, _uiGridGroupingConstants_,
                              _$rootScope_, _GridRow_) {
    uiGridGroupingService = _uiGridGroupingService_;
    uiGridGroupingConstants = _uiGridGroupingConstants_;
    gridClassFactory = _gridClassFactory_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    GridRow = _GridRow_;

    $templateCache.put('ui-grid/uiGridCell', '<div/>');
    $templateCache.put('ui-grid/editableCell', '<div editable_cell_directive></div>');

    grid = gridClassFactory.createGrid({});
    grid.options.columnDefs = [
      {field: 'col0', enableGrouping: true},
      {field: 'col1', enableGrouping: true},
      {field: 'col2', enableGrouping: true},
      {field: 'col3', enableGrouping: true}
    ];

    _uiGridGroupingService_.initializeGrid(grid, $scope);
    var data = [];
    for (var i = 0; i < 10; i++) {
      data.push({col0: 'a_' + Math.floor(i/4), col1: 'b_' + Math.floor(i/2), col2: 'c_' + i, col3: 'd_' + i});
    }
    grid.options.data = data;

    grid.buildColumns();
    grid.modifyRows(grid.options.data);
  }));


  describe( 'tidySortPriority', function() {
    it( 'no group columns, no sort columns, no errors', function() {
      uiGridGroupingService.tidyPriorities( grid );
    });

    it( 'some group columns, some sort columns, tidies correctly', function() {
      grid.columns[0].sort = { priority: 1};
      grid.columns[0].grouping = { groupPriority: 3};
      grid.columns[1].sort = {priority: 9};
      grid.columns[2].sort = {priority: 1};
      grid.columns[2].grouping = { groupPriority: 2 };
      grid.columns[3].sort = {priority: 0};
      
      uiGridGroupingService.tidyPriorities( grid );
      expect(grid.columns[2].grouping.groupPriority).toEqual(0, 'column 2 groupPriority');
      expect(grid.columns[2].sort.priority).toEqual(0, 'column 2 sort priority');
      expect(grid.columns[0].grouping.groupPriority).toEqual(1, 'column 0 groupPriority');
      expect(grid.columns[0].sort.priority).toEqual(1, 'column 0 sort priority');
      expect(grid.columns[3].sort.priority).toEqual(2, 'column 3 sort priority');
      expect(grid.columns[1].sort.priority).toEqual(3, 'column 1 sort priority');
    });
    
  });


  describe( 'moveGroupColumns', function() {
    it( 'move some columns left, and some columns right', function() {
      
    });
  });


  describe( 'groupRows', function() {
    it( 'group by col0 then col1', function() {
      spyOn(gridClassFactory, 'rowTemplateAssigner').andCallFake( function() {});
      grid.columns[0].grouping = { groupPriority: 1 };
      grid.columns[1].grouping = { groupPriority: 2 };
      
      var groupedRows = uiGridGroupingService.groupRows.call( grid, grid.rows );

/*      
      console.log('data');
      for (var i = 0; i < 10; i++) {
        console.log(grid.options.data[i]);
      }
      
      console.log('results');
      for (i = 0; i < 18; i++) {
        console.log(grid.rows[i].entity);
      }
*/      
      expect( groupedRows.length ).toEqual( 18, 'we\'ve added 3 col0 headers, and 5 col2 headers' );
    });
  });

  describe('initialiseProcessingState', function() {
    it('no grouping', function() {
      grid.columns[1].grouping = {aggregation: uiGridGroupingConstants.aggregation.COUNT};
      grid.columns[3].grouping = {aggregation: uiGridGroupingConstants.aggregation.SUM};
      
      expect(uiGridGroupingService.initialiseProcessingState(grid)).toEqual([
      ]);
    });
    
    it('no aggregation', function() {
      grid.columns[1].grouping = {groupPriority: 3};
      grid.columns[3].grouping = {groupPriority: 2};

      expect(uiGridGroupingService.initialiseProcessingState(grid)).toEqual([
        { fieldName: 'col3', initialised: false, currentValue: null, currentGroupHeader: null, runningAggregations: {} },
        { fieldName: 'col1', initialised: false, currentValue: null, currentGroupHeader: null, runningAggregations: {} }
      ]);
    });
    
    it('mixture of settings', function() {
      grid.columns[0].grouping = {aggregation: uiGridGroupingConstants.aggregation.COUNT};
      grid.columns[1].grouping = {groupPriority: 3};
      grid.columns[2].grouping = {aggregation: uiGridGroupingConstants.aggregation.SUM};
      grid.columns[3].grouping = {groupPriority: 2};

      expect(uiGridGroupingService.initialiseProcessingState(grid)).toEqual([
        { fieldName: 'col3', initialised: false, currentValue: null, currentGroupHeader: null, runningAggregations: {
          col0: { type: uiGridGroupingConstants.aggregation.COUNT, value: null },
          col2: { type: uiGridGroupingConstants.aggregation.SUM, value: null }
        } },
        { fieldName: 'col1', initialised: false, currentValue: null, currentGroupHeader: null, runningAggregations: {
          col0: { type: uiGridGroupingConstants.aggregation.COUNT, value: null },
          col2: { type: uiGridGroupingConstants.aggregation.SUM, value: null }
        } }
      ]);
    });
  });


  describe('getGrouping', function() {
    it('should find no grouping', function() {
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({
        grouping: [],
        aggregations: []
      });
    });
    
    it('finds one grouping', function() {
      grid.columns[1].grouping = {groupPriority: 0};
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({ 
        grouping: [{ field: 'col1', groupPriority: 0 }],
        aggregations: []
      });
    });

    it('finds one aggregation, has no priority', function() {
      grid.columns[1].grouping = {aggregation: uiGridGroupingConstants.aggregation.COUNT};
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({
        grouping: [],
        aggregations: [{ field: 'col1', aggregation: uiGridGroupingConstants.aggregation.COUNT} ]
      });
    });

    it('finds one aggregation, has a priority, aggregation is ignored', function() {
      grid.columns[1].grouping = {groupPriority: 0, aggregation: uiGridGroupingConstants.aggregation.COUNT};
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({
        grouping: [{ field: 'col1', groupPriority: 0 }],
        aggregations: []
      });
    });

    it('finds one aggregation, has no priority, aggregation is stored', function() {
      grid.columns[1].grouping = {groupPriority: -1, aggregation: uiGridGroupingConstants.aggregation.COUNT};
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({
        grouping: [],
        aggregations: [ { field: 'col1', aggregation: uiGridGroupingConstants.aggregation.COUNT } ]
      });
    });

    it('multiple finds, sorts correctly', function() {
      grid.columns[1].grouping = {aggregation: uiGridGroupingConstants.aggregation.COUNT};
      grid.columns[2].grouping = {groupPriority: 1};
      grid.columns[3].grouping = {groupPriority: 0, aggregation: uiGridGroupingConstants.aggregation.COUNT};
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({
        grouping: [
          { field: 'col3', groupPriority: 0 },
          { field: 'col2', groupPriority: 1 }
        ],
        aggregations: [
          { field: 'col1', aggregation: uiGridGroupingConstants.aggregation.COUNT}
        ]
      });
    });

    it('different multiple finds, sorts correctly', function() {
      grid.columns[1].grouping = {groupPriority: 0};
      grid.columns[2].grouping = {groupPriority: 2};
      grid.columns[3].grouping = {groupPriority: 1};
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({
        grouping: [
          { field: 'col1', groupPriority: 0 },
          { field: 'col3', groupPriority: 1 },
          { field: 'col2', groupPriority: 2 }
       ],
       aggregations: []
      });
    });

    it('renumbers non-contiguous grouping', function() {
      grid.columns[1].grouping = {groupPriority: 2};
      grid.columns[2].grouping = {groupPriority: 6};
      grid.columns[3].grouping = {groupPriority: 4};
      expect(uiGridGroupingService.getGrouping(grid)).toEqual({
        grouping: [
          { field: 'col1', groupPriority: 0 },
          { field: 'col3', groupPriority: 1 },
          { field: 'col2', groupPriority: 2 }
       ],
       aggregations: []
      });
    });
  });
  

  describe('insertGroupHeader', function() {
    it('inserts a header in the middle', function() {
      spyOn(gridClassFactory, 'rowTemplateAssigner').andCallFake( function() {});
      var headerRow1 = new GridRow( {}, null, grid );
      var headerRow2 = new GridRow( {}, null, grid );
      var headerRow3 = new GridRow( {}, null, grid );

      headerRow1.expandedState = { state: uiGridGroupingConstants.EXPANDED };
      headerRow2.expandedState = { state: uiGridGroupingConstants.COLLAPSED };
       
      var processingStates = [
        { 
          fieldName: 'col1', 
          initialised: true,
          currentValue: 'test',
          currentGroupHeader: headerRow1,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: '1234'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 98 }
          }
        },
        { 
          fieldName: 'col2', 
          initialised: true,
          currentValue: 'blah',
          currentGroupHeader: headerRow2,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: 'x'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 22 }
          }
        },
        { 
          fieldName: 'col3', 
          initialised: true,
          currentValue: 'fred',
          currentGroupHeader: headerRow3,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: 'y'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 13 }
          }
        }
      ];
      
      uiGridGroupingService.insertGroupHeader(grid, grid.rows, 3, processingStates, 1);
      
      expect( grid.rows.length ).toEqual(11, 'extra row created');
      expect( grid.rows[3].entity).toEqual({col2: 'c_3'}, 'no aggregations yet, only the group title');
      expect( grid.rows[3].entity).toEqual({col2: 'c_3'}, 'no aggregations yet, only the group title');
      expect(headerRow2.entity).toEqual({ agg1: 'max: x', agg2: 'min: 22' });
      expect(headerRow3.entity).toEqual({ agg1: 'max: y', agg2: 'min: 13' });
      
      expect( processingStates[0].currentGroupHeader ).toBe(headerRow1);
      processingStates[0].currentGroupHeader = 'x';
      expect( processingStates[1].currentGroupHeader ).toBe(grid.rows[3]);
      processingStates[1].currentGroupHeader = 'y';
      expect(processingStates).toEqual([
        { 
          fieldName: 'col1', 
          initialised: true,
          currentValue: 'test',
          currentGroupHeader: 'x',
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: '1234'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 98 }
          }
        },
        { 
          fieldName: 'col2', 
          initialised: true,
          currentValue: 'c_3',
          currentGroupHeader: 'y',
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: null },
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: null }
          }
        },
        { 
          fieldName: 'col3', 
          initialised: false,
          currentValue: null,
          currentGroupHeader: null,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: null },
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: null }
          }
        }
      ]);
    });
  });


  describe('writeOutAggregations', function() {
    it('one state', function() {
      var headerRow1 = new GridRow( {}, null, grid );
       
      var processingStates = [
        { 
          fieldName: 'col1', 
          initialised: true,
          currentValue: 'test',
          currentGroupHeader: headerRow1,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: '1234'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 98 }
          }
        }
      ];
      
      uiGridGroupingService.writeOutAggregations( grid, processingStates, 0 );
      
      expect(headerRow1.entity).toEqual({ agg1: 'max: 1234', agg2: 'min: 98' });
      expect(processingStates).toEqual([
        {
          fieldName: 'col1', 
          initialised: false,
          currentValue: null,
          currentGroupHeader: null,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: null},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: null }
          }
        }
      ]);
    });
    
    it('many states, start in the middle', function() {
      var headerRow1 = new GridRow( {}, null, grid );
      var headerRow2 = new GridRow( {}, null, grid );
      var headerRow3 = new GridRow( {}, null, grid );
       
      var processingStates = [
        { 
          fieldName: 'col1', 
          initialised: true,
          currentValue: 'test',
          currentGroupHeader: headerRow1,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: '1234'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 98 }
          }
        },
        { 
          fieldName: 'col2', 
          initialised: true,
          currentValue: 'blah',
          currentGroupHeader: headerRow2,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: 'x'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 22 }
          }
        },
        { 
          fieldName: 'col3', 
          initialised: true,
          currentValue: 'fred',
          currentGroupHeader: headerRow3,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: 'y'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 13 }
          }
        }
      ];
      
      uiGridGroupingService.writeOutAggregations( grid, processingStates, 1 );
      
      expect(headerRow1.entity).toEqual({});
      expect(headerRow2.entity).toEqual({ agg1: 'max: x', agg2: 'min: 22' });
      expect(headerRow3.entity).toEqual({ agg1: 'max: y', agg2: 'min: 13' });
      
      expect(processingStates).toEqual([
        { 
          fieldName: 'col1', 
          initialised: true,
          currentValue: 'test',
          currentGroupHeader: headerRow1,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: '1234'},
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 98 }
          }
        },
        { 
          fieldName: 'col2', 
          initialised: false,
          currentValue: null,
          currentGroupHeader: null,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: null },
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: null }
          }
        },
        { 
          fieldName: 'col3', 
          initialised: false,
          currentValue: null,
          currentGroupHeader: null,
          runningAggregations: {
            agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: null },
            agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: null }
          }
        }
      ]);
    });    
  });
  

  describe('writeOutAggregation', function() {
    it('no rowHeader', function() {
      var processingState = { 
        fieldName: 'col1', 
        initialised: true,
        currentValue: 'test',
        currentGroupHeader: null,
        runningAggregations: {
        }
      };
      
      uiGridGroupingService.writeOutAggregation( grid, processingState );
      
      expect(processingState).toEqual({
        fieldName: 'col1', 
        initialised: false,
        currentValue: null,
        currentGroupHeader: null,
        runningAggregations: {
        }
      });
    });

    it('no aggregations', function() {
      var headerRow = new GridRow( {}, null, grid );
       
      var processingState = { 
        fieldName: 'col1', 
        initialised: true,
        currentValue: 'test',
        currentGroupHeader: headerRow,
        runningAggregations: {
        }
      };
      
      uiGridGroupingService.writeOutAggregation( grid, processingState );
      
      expect(headerRow.entity).toEqual({});
      expect(processingState).toEqual({
        fieldName: 'col1', 
        initialised: false,
        currentValue: null,
        currentGroupHeader: null,
        runningAggregations: {
        }
      });
    });

    it('some aggregations', function() {
      var headerRow = new GridRow( {}, null, grid );
       
      var processingState = { 
        fieldName: 'col1', 
        initialised: true,
        currentValue: 'test',
        currentGroupHeader: headerRow,
        runningAggregations: {
          agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: '1234'},
          agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: 98 }
        }
      };
      
      uiGridGroupingService.writeOutAggregation( grid, processingState );
      
      expect(headerRow.entity).toEqual({ agg1: 'max: 1234', agg2: 'min: 98' });
      expect(processingState).toEqual({
        fieldName: 'col1', 
        initialised: false,
        currentValue: null,
        currentGroupHeader: null,
        runningAggregations: {
          agg1: { type: uiGridGroupingConstants.aggregation.MAX, value: null},
          agg2: { type: uiGridGroupingConstants.aggregation.MIN, value: null }
        }
      });
    });
  });
  
  
  describe( 'getExpandedState', function() {
    it( 'empty states', function() {
      grid.grouping.rowExpandedStates = {};
      
      var processingStates = [
        { 
          fieldName: 'col1', 
          currentValue: 'test'
        },
        { 
          fieldName: 'col2', 
          currentValue: 'blah'
        },
        { 
          fieldName: 'col3', 
          currentValue: 'fred'
        }
      ];
      
      var expandedState = uiGridGroupingService.getExpandedState( grid, processingStates, 1);
      
      expect( grid.grouping.rowExpandedStates ).toEqual(
        {
          test: {
            state: 'collapsed',
            blah: {
              state: 'collapsed'
            }
          }
        }
      );
      expect( expandedState ).toBe( grid.grouping.rowExpandedStates.test.blah);      
    });

    it( 'existing states', function() {
      grid.grouping.rowExpandedStates = {
        test: {
          state: 'collapsed',
          blah: {
            state: 'collapsed'
          },
          fred: {
            state: 'expanded'
          }
        }
      };
      
      var processingStates = [
        { 
          fieldName: 'col1', 
          currentValue: 'test'
        },
        { 
          fieldName: 'col2', 
          currentValue: 'blah'
        },
        { 
          fieldName: 'col3', 
          currentValue: 'fred'
        }
      ];
      
      var expandedState = uiGridGroupingService.getExpandedState( grid, processingStates, 1);
      
      expect( grid.grouping.rowExpandedStates ).toEqual(
        {
          test: {
            state: 'collapsed',
            blah: {
              state: 'collapsed'
            },
            fred: {
              state: 'expanded'
            }
          }
        }
      );
      expect( expandedState ).toBe( grid.grouping.rowExpandedStates.test.blah);      
    });
  });
  
  
  describe( 'setVisibility', function() {
    it( 'invisible', function() {
      var headerRow1 = new GridRow( {}, null, grid );
      var headerRow2 = new GridRow( {}, null, grid );
      
      headerRow1.expandedState = { state: uiGridGroupingConstants.EXPANDED };
      headerRow2.expandedState = { state: uiGridGroupingConstants.COLLAPSED };
      
      var processingStates = [
        { 
          fieldName: 'col1', 
          currentGroupHeader: headerRow1
        },
        { 
          fieldName: 'col2', 
          currentGroupHeader: headerRow2
        }
      ];
      
      uiGridGroupingService.setVisibility( grid, grid.rows[1], processingStates );
      expect( grid.rows[1].visible ).toEqual(false);
      expect( grid.rows[1].invisibleReason.grouping).toEqual(true);
    });

    it( 'visible', function() {
      var headerRow1 = new GridRow( {}, null, grid );
      var headerRow2 = new GridRow( {}, null, grid );
      
      headerRow1.expandedState = { state: uiGridGroupingConstants.EXPANDED };
      headerRow2.expandedState = { state: uiGridGroupingConstants.EXPANDED };
      
      var processingStates = [
        { 
          fieldName: 'col1', 
          currentGroupHeader: headerRow1
        },
        { 
          fieldName: 'col2', 
          currentGroupHeader: headerRow2
        }
      ];
      
      uiGridGroupingService.setVisibility( grid, grid.rows[1], processingStates );
      expect( grid.rows[1].visible ).toEqual(true);
      expect( grid.rows[1].invisibleReason).toEqual(undefined);
    });
  });
  
  
  describe( 'aggregate', function() {
    it( 'aggregates many fields', function() {
      var groupFieldState = {
        runningAggregations: {
          col0: { type: uiGridGroupingConstants.aggregation.COUNT, value: 3 },
          col1: { type: uiGridGroupingConstants.aggregation.SUM, value: 48 },
          col2: { type: uiGridGroupingConstants.aggregation.MAX, value: 5 },
          col3: { type: uiGridGroupingConstants.aggregation.MIN, value: 28 }
        }
      };
      
      var row = new GridRow( { col0: 'x', col1: 10, col2: '7', col3: '22' }, null, grid );
      
      uiGridGroupingService.aggregate( grid, row, groupFieldState);
      
      expect( groupFieldState ).toEqual({
        runningAggregations: {
          col0: { type: uiGridGroupingConstants.aggregation.COUNT, value: 4 },
          col1: { type: uiGridGroupingConstants.aggregation.SUM, value: 58 },
          col2: { type: uiGridGroupingConstants.aggregation.MAX, value: '7' },
          col3: { type: uiGridGroupingConstants.aggregation.MIN, value: '22' }
        }
      });
    });

    it( 'aggregates many fields, doesn\'t trigger max and min', function() {
       var groupFieldState = {
        runningAggregations: {
          col0: { type: uiGridGroupingConstants.aggregation.COUNT, value: 3 },
          col1: { type: uiGridGroupingConstants.aggregation.SUM, value: 48 },
          col2: { type: uiGridGroupingConstants.aggregation.MAX, value: 5 },
          col3: { type: uiGridGroupingConstants.aggregation.MIN, value: 28 }
        }
      };
      
      var row = new GridRow( { col0: 'x', col1: 10, col2: '3', col3: '30' }, null, grid );
      
      uiGridGroupingService.aggregate( grid, row, groupFieldState);
      
      expect( groupFieldState ).toEqual({
        runningAggregations: {
          col0: { type: uiGridGroupingConstants.aggregation.COUNT, value: 4 },
          col1: { type: uiGridGroupingConstants.aggregation.SUM, value: 58 },
          col2: { type: uiGridGroupingConstants.aggregation.MAX, value: 5 },
          col3: { type: uiGridGroupingConstants.aggregation.MIN, value: 28 }
        }
      });
    });
  });
});