/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use. this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2021 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

//== OBProcessFileUpload ==
//This class is used to upload files to a process definition
isc.ClassFactory.defineClass('OBProcessFileUpload', isc.FileItem);

isc.OBProcessFileUpload.addProperties({
  init() {
    this.Super('init', arguments);

    // To submit the file is needed a DynamicForm that contains a UploadFile item. In this case it
    // is used the FileItemForm that it is automatically generated for the FileItem. To submit all
    // the values it is needed to create in this form all the needed hidden inputs.
    var view = this.view;
    var fileForm = this.canvas;
    var fileFormFields = isc.shallowClone(fileForm.getItems());
    // paramValues has a String representation of a JSONObject with the values of all the metadata values.
    fileFormFields.addAll([
      {
        name: 'paramValues',
        type: 'hidden',
        value: ''
      },
      {
        name: 'processId',
        type: 'hidden',
        value: view.processId
      },
      {
        name: 'viewId',
        type: 'hidden',
        value: view.ID
      }
    ]);
    fileForm.setItems(fileFormFields);
    // redraw to ensure that the new items are added to the html form. If this not happens then the
    // values are not included in the submitForm.
    fileForm.redraw();
    fileForm.setAction(
      'org.openbravo.client.kernel?_action=' + view.actionHandler
    );
    fileForm.setTarget('background_target');

    // Finally, override form's doProcess to send the request using the file form instead of the process one
    view.doProcess = this.doProcess;
  },
  /**
   * FIXME: Basically this is a copy of ob-parameter-window-view doProcess where we use FileItem's dynamic form to send the
   * form along with the file. If this code is refactored to make actionHandlerCall not dependant
   * on allProperties this function can be passed to doProcess and avoid duplicate this function.
   */
  doProcess: function(btnValue) {
    const view = this,
      form = this.theForm;
    let allProperties = view.getUnderLyingRecordContext(
        false,
        true,
        false,
        true
      ),
      tab,
      actionHandlerCall,
      clientSideValidationFail;

    if (view.resultLayout && view.resultLayout.destroy) {
      view.resultLayout.destroy();
      delete view.resultLayout;
    }
    // change tab title to show executing...
    tab = OB.MainView.TabSet.getTab(view.viewTabId);
    if (tab) {
      tab.setTitle(
        OB.I18N.getLabel('OBUIAPP_ProcessTitle_Executing', [view.tabTitle])
      );
    }

    allProperties._buttonValue = btnValue || 'DONE';
    allProperties._params = view.getContextInfo();

    // allow to add external parameters
    isc.addProperties(allProperties._params, view.externalParams);

    actionHandlerCall = function() {
      view.showProcessing(true);
      form
        .getFileItemForm()
        .getItem('paramValues')
        .setValue(isc.JSON.encode(allProperties));
      form.getFileItemForm().submitForm();
    };

    if (view.clientSideValidation) {
      clientSideValidationFail = function() {
        view.setAllButtonEnabled(view.allRequiredParametersSet());
      };
      view.clientSideValidation(
        view,
        actionHandlerCall,
        clientSideValidationFail
      );
    } else {
      actionHandlerCall();
    }
  }
});
