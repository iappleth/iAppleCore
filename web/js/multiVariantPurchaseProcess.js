/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2024 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

OB = OB || {};

OB.MultiVariantPurchaseGrid = {
  execute: function(params, view) {
    var i,
      selection = params.button.contextView.viewGrid.getSelectedRecords(),
      recordIdList = [],
      messageBar = view.getView(params.adTabId).messageBar,
      callback,
      validationMessage,
      validationOK = true;

    callback = function(rpcResponse, data, rpcRequest) {
      var status = rpcResponse.status,
        view = rpcRequest.clientContext.view.getView(params.adTabId);
      view.messageBar.setMessage(
        data.message.severity,
        null,
        data.message.text
      );

      // close process to refresh current view
      params.button.closeProcessPopup();
    };

    for (i = 0; i < selection.length; i++) {
      recordIdList.push(selection[i].id);
    }

    isc.MultiVariantPurchaseGridProcessPopup.create({
      recordIdList: recordIdList,
      view: view,
      params: params
    }).show();
  },

  open: function(params, view) {
    params.actionHandler =
      'org.openbravo.client.application.event.OpenClosePeriodHandler';
    params.adTabId = view.activeView.tabId;
    params.processId = 'A832A5DA28FB4BB391BDE883E928DFC5';
    OB.MultiVariantPurchaseGrid.execute(params, view);
  }
};

// 22803EBEEC804A648723B2B7070DBB7D is the id for the ProductVariantDataSource
const PRODUCT_VARIANT_DATA_SOURCE_ID = '22803EBEEC804A648723B2B7070DBB7D';

const getViewProperties = (recordId, view) => ({
  allowAdd: true,
  allowDelete: true,
  showSelect: false,
  selectionType: 'S',
  arrowKeyAction: 'select',
  autoFetchData: true,
  selectionFn: (ignored, record, state) => {
    if (state === true) {
      console.log(record, state);
      if (record.newRow) {
        // TODO: Add row and column characteristics
        const requestProperties = {};
        requestProperties.params = {};
        requestProperties.params._startRow = 0;
        requestProperties.params._endRow = 200;
        const o = {
          setDataSource: dataS => {
            this.dataSource = dataS;
            this.dataSource.fetchData(
              {},
              response => {
                console.log('DATA FETCHED: ', response);
              },
              requestProperties
            );
          }
        };
        OB.Datasource.get('CharacteristicValue', o, null, false);

        return;
      }
      // Record has been selected, reset the bottom table
      OB.MultiVariantPurchaseGridItem.selectProduct(
        record.product,
        record.listOfItems[0],
        record.listOfItems[1]
      );
    }
  },
  newFn: grid => {
    var returnObject = isc.addProperties({}, grid.data[0]);
    returnObject.newRow = true;
    returnObject.quantity = 0;
    return returnObject;
  },
  dataSourceProperties: {
    createClassName: '',
    dataURL: `/openbravo/org.openbravo.service.datasource/${PRODUCT_VARIANT_DATA_SOURCE_ID}`,
    requestProperties: {
      params: {
        Constants_IDENTIFIER: OB.Constants.IDENTIFIER,
        Constants_FIELDSEPARATOR: OB.Constants.FIELDSEPARATOR,
        recordId: recordId
      }
    },
    fields: [
      {
        name: 'product',
        type: '_id_AA08D5AFC89D4F6CB838064FC06EF5E4'
      }
    ]
  },
  fields: [
    {
      name: 'product',
      id: '1127',
      title: 'Product',
      required: true,
      sessionProperty: true,
      columnName: 'M_Product_ID',
      inpColumnName: 'inpmProductId',
      refColumnName: 'M_Product_ID',
      targetEntity: 'Product',
      firstFocusedField: true,
      selectorDefinitionId: 'D55B3817C9CF4AC4AFEE7B0222C1453A',
      popupTextMatchStyle: 'substring',
      textMatchStyle: 'substring',
      defaultPopupFilterField: '_identifier',
      displayField: '_identifier',
      valueField: 'id',
      sortByField: '_identifier',
      pickListFields: [
        { title: 'Product', name: '_identifier', type: 'text' },
        {
          title: 'Row characteristic',
          name: 'rowCharacteristic',
          displayField: 'name',
          type: 'text'
        },
        {
          title: 'Column characteristic',
          name: 'columnCharacteristic',
          displayField: 'name',
          type: 'text'
        }
      ],
      showSelectorGrid: true,
      // TODO: Reduce the amount of selector grid fields to only those necessary
      selectorGridFields: [
        {
          title: 'Search Key',
          name: 'searchKey',
          type: '_id_10',
          showHover: true
        },
        {
          title: 'Name',
          name: 'name',
          type: '_id_10',
          showHover: true
        },
        {
          title: 'Characteristic Description',
          name: 'characteristicDescription',
          type: '_id_C632F1CFF5A1453EB28BDF44A70478F8',
          showHover: true
        },
        {
          title: 'Row Characteristic',
          name: 'rowCharacteristic',
          displayField: 'rowCharacteristic$_identifier',
          type: '_id_10',
          showHover: true
        },
        {
          title: 'Column Characteristic',
          name: 'columnCharacteristic',
          displayField: 'columnCharacteristic$_identifier',
          type: '_id_10',
          showHover: true
        }
      ],
      extraSearchFields: [
        'product$searchKey',
        'product$name',
        'product$_identifier'
      ],
      init: function() {
        this.optionDataSource = OB.Datasource.create({
          createClassName: '',
          dataURL: '/openbravo/org.openbravo.service.datasource/Product',
          requestProperties: {
            params: {
              adTabId: '187',
              Constants_IDENTIFIER: '_identifier',
              Constants_FIELDSEPARATOR: '$',
              targetProperty: 'product',
              _extraProperties: '',
              columnName: 'M_Product_ID',
              IsSelectorItem: 'true'
            }
          },
          fields: [
            { name: 'id', type: '_id_13', primaryKey: true },
            { name: 'client', type: '_id_19' },
            { name: 'client$_identifier' },
            { name: 'organization', type: '_id_19' },
            { name: 'organization$_identifier' },
            { name: 'active', type: '_id_20' },
            { name: 'updated', type: '_id_16' },
            { name: 'updatedBy', type: '_id_30' },
            { name: 'updatedBy$_identifier' },
            { name: 'creationDate', type: '_id_16' },
            { name: 'createdBy', type: '_id_30' },
            { name: 'createdBy$_identifier' },
            { name: '_identifier' }
          ]
        });
        this.Super('init', arguments);
      },
      outHiddenInputPrefix: 'inpmProductId',
      gridProps: {
        sort: 2,
        autoExpand: true,
        displaylength: 44,
        fkField: true,
        selectOnClick: true,
        canSort: true,
        canFilter: true,
        showHover: true,
        filterEditorProperties: { keyProperty: 'id' }
      },
      type: '_id_AA08D5AFC89D4F6CB838064FC06EF5E4'
    },
    {
      name: 'quantity',
      id: 'quantity',
      title: 'Quantity',
      disabled: false,
      canEdit: false,
      updatable: false,
      columnName: 'quantity',
      inpColumnName: 'quantity',
      length: 16,
      gridProps: {
        sort: 3,
        autoExpand: true,
        length: 16,
        displaylength: 16,
        selectOnClick: false,
        canFilter: false,
        showHover: true,
        canSort: false,
        width: 50
      },
      type: '_id_29'
    },
    { name: 'listOfOptions', visible: false }
  ],
  gridProperties: {
    orderByClause: '',
    filterClause: false,
    allowSummaryFunctions: false,
    alias: 'e',
    lazyFiltering: false
  },
  standardProperties: {},
  statusTabFields: [],
  tabId: ''
});

isc.ClassFactory.defineClass('ProductSelectionGridItem', isc.CanvasItem);
isc.ProductSelectionGridItem.addProperties({
  height: 300,
  showTitle: false,
  isPickAndExecuteWindow: true,
  alternateRecordStyles: true,
  showFilterEditor: true,
  canReorderFields: false,
  canFreezeFields: false,
  canGroupBy: false,
  canAutoFitFields: false,
  dataPageSize: 100,
  init: function() {
    const modifiedView = isc.addProperties(this.view, {
      getUnderLyingRecordContext: () => ({})
    });

    this.canvas = isc.OBPickAndExecuteView.create({
      height: 300,
      view: modifiedView,
      viewProperties: getViewProperties(this.recordId, modifiedView)
    });
    this.Super('init', arguments);
    this.selectionLayout = this.canvas;
  }
});

isc.defineClass('MultiVariantPurchaseGridProcessPopup', isc.OBPopup);

isc.MultiVariantPurchaseGridProcessPopup.addProperties({
  width: 600,
  height: 600,
  title: 'Add Lines for Variants',
  showMinimizeButton: false,
  showMaximizeButton: false,

  //Form
  mainform: null,

  //Button
  okButton: null,
  cancelButton: null,

  getProductGrid: function(view, recordId) {
    return {
      type: 'ProductSelectionGridItem',
      title: 'Product grid',
      name: 'product-grid',
      editorType: 'ProductSelectionGridItem',
      view: view,
      recordId: recordId
    };
  },

  getGrid: function() {
    return {
      type: 'MultiVariantPurchaseGridItem',
      title: 'Characteristics grid',
      name: 'ch-grid',
      editorType: 'MultiVariantPurchaseGridItem'
    };
  },

  initWidget: function() {
    var recordIdList = this.recordIdList,
      originalView = this.view,
      params = this.params;

    this.mainform = isc.DynamicForm.create({
      view: originalView,
      numCols: 1,
      colWidths: ['100%'],
      fields: [
        this.getProductGrid(originalView, recordIdList[0]),
        this.getGrid()
      ]
    });

    this.okButton = isc.OBFormButton.create({
      title: OB.I18N.getLabel('OK'),
      popup: this,
      action: function() {
        var callback, action;

        callback = function(rpcResponse, data, rpcRequest) {
          var status = rpcResponse.status,
            view = rpcRequest.clientContext.originalView.getView(
              params.adTabId
            );
          if (data.message) {
            view.messageBar.setMessage(
              data.message.severity,
              null,
              data.message.text
            );
          }

          rpcRequest.clientContext.popup.closeClick();
          rpcRequest.clientContext.originalView.refresh(false, false);
        };

        action = this.popup.mainform.getItem('Action').getValue();

        OB.RemoteCallManager.call(
          params.actionHandler,
          {
            closePeriodStepId: this.popup.mainform.getItem('Action')
              .closePeriodStepId,
            recordIdList: recordIdList,
            action: action
          },
          {},
          callback,
          {
            originalView: this.popup.view,
            popup: this.popup
          }
        );
      }
    });

    this.cancelButton = isc.OBFormButton.create({
      title: OB.I18N.getLabel('Cancel'),
      popup: this,
      action: function() {
        this.popup.closeClick();
      }
    });

    this.items = [
      isc.VLayout.create({
        defaultLayoutAlign: 'center',
        align: 'center',
        width: '100%',
        layoutMargin: 10,
        membersMargin: 6,
        members: [
          isc.HLayout.create({
            defaultLayoutAlign: 'center',
            height: '75%',
            align: 'center',
            layoutMargin: 15,
            membersMargin: 6,
            members: this.mainform
          }),
          isc.HLayout.create({
            defaultLayoutAlign: 'center',
            height: '25%',
            align: 'center',
            membersMargin: 10,
            members: [this.okButton, this.cancelButton]
          })
        ]
      })
    ];

    this.Super('initWidget', arguments);
  }
});
