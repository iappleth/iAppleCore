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
 * All portions are Copyright (C) 2011-2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
// = OBAttachments =
//
// Represents the attachments section in the form.
//
isc.ClassFactory.defineClass('OBAttachmentsSectionItem', isc.OBSectionItem);

isc.OBAttachmentsSectionItem.addProperties({
  // as the name is always the same there should be at most
  // one linked item section per form
  name: '_attachments_',

  // note: setting these apparently completely hides the section
  // width: '100%',
  // height: '100%',
  // this field group does not participate in personalization
  personalizable: false,

  canFocus: true,

  // don't expand as a default
  sectionExpanded: false,

  prompt: OB.I18N.getLabel('OBUIAPP_AttachmentPrompt'),

  attachmentCanvasItem: null,

  visible: false,

  itemIds: ['_attachments_Canvas'],

  // note formitems don't have an initWidget but an init method
  init: function () {
    // override the one passed in
    this.defaultValue = OB.I18N.getLabel('OBUIAPP_AttachmentTitle');
    this.sectionExpanded = false;

    // tell the form who we are
    this.form.attachmentsSection = this;

    return this.Super('init', arguments);
  },

  getAttachmentPart: function () {
    if (!this.attachmentCanvasItem) {
      this.attachmentCanvasItem = this.form.getField(this.itemIds[0]);
    }
    return this.attachmentCanvasItem.canvas;
  },

  setRecordInfo: function (entity, id, tabId, attachmentForm) {
    this.getAttachmentPart().setRecordInfo(entity, id, tabId, attachmentForm);
  },

  collapseSection: function () {
    var ret = this.Super('collapseSection', arguments);
    this.getAttachmentPart().setExpanded(false);
    return ret;
  },

  expandSection: function () {
    // if this is not there then when clicking inside the 
    // section item will visualize it
    if (!this.isVisible()) {
      return;
    }
    var ret = this.Super('expandSection', arguments);
    this.getAttachmentPart().setExpanded(true);
    return ret;
  },

  fillAttachments: function (attachments) {
    this.getAttachmentPart().fillAttachments(attachments);
  }
});


isc.ClassFactory.defineClass('OBAttachmentCanvasItem', isc.CanvasItem);

isc.OBAttachmentCanvasItem.addProperties({

  // some defaults, note if this changes then also the 
  // field generation logic needs to be checked
  colSpan: 4,
  startRow: true,
  endRow: true,

  canFocus: true,

  // setting width/height makes the canvasitem to be hidden after a few
  // clicks on the section item, so don't do that for now
  // width: '100%',
  // height: '100%',
  showTitle: false,

  // note that explicitly setting the canvas gives an error as not
  // all props are set correctly on the canvas (for example the
  // pointer back to this item: canvasItem
  // for setting more properties use canvasProperties, etc. see
  // the docs
  canvasConstructor: 'OBAttachmentsLayout',

  // never disable this one
  isDisabled: function () {
    return false;
  }

});

isc.ClassFactory.defineClass('OBAttachmentsSubmitPopup', isc.OBPopup);

isc.OBAttachmentsSubmitPopup.addProperties({
  submitButton: null,
  addForm: null,
  showMinimizeButton: false,
  showMaximizeButton: false,
  title: OB.I18N.getLabel('OBUIAPP_AttachFile'),
  initWidget: function (args) {
    this.addItem(
    isc.VLayout.create({
      defaultLayoutAlign: 'center',
      align: 'center',
      width: '100%',
      height: 300,
      overflow: 'auto',
      layoutMargin: 10,
      membersMargin: 6,
      members: [
      isc.VLayout.create({
        defaultLayoutAlign: 'center',
        align: 'center',
        layoutMargin: 30,
        members: this.addForm
      }), isc.HLayout.create({
        defaultLayoutAlign: 'center',
        align: 'center',
        membersMargin: 10,
        members: [this.submitButton]
      })]
    }));
    this.Super('initWidget', arguments);
  }
});

isc.ClassFactory.defineClass('OBAttachmentsLayout', isc.VLayout);

isc.OBAttachmentsLayout.addProperties({

  // set to true when the content has been created at first expand
  isInitialized: false,

  layoutMargin: 5,

  width: '100%',
  align: 'left',
  docOrganization: null,

  // never disable this item
  isDisabled: function () {
    return false;
  },

  getForm: function () {
    return this.canvasItem.form;
  },

  setRecordInfo: function (entity, id, tabId, attachmentForm) {
    this.entity = entity;
    // use recordId instead of id, as id is often used to keep
    // html ids
    this.recordId = id;
    this.tabId = tabId;
    this.attachmentForm = attachmentForm;
    this.isInitialized = false;
  },


  setExpanded: function (expanded) {
    if (expanded && !this.isInitialized) {
      this.isInitialized = true;
    }
  },

  addAttachmentInfo: function (attachmentLayout, attachment) {},

  callback: function (attachmentsobj) {
    var button = this.getForm().view.toolBar.getLeftMember(isc.OBToolbar.TYPE_ATTACHMENTS);
    if (!button) {
      button = this.getForm().view.toolBar.getLeftMember("attachExists");
    }
    button.customState = '';
    button.resetBaseStyle();
    this.fillAttachments(attachmentsobj.attachments);
  },
  resetToolbar: function () {
    var canvas = null;
    var currentElement = null;
    var positionOfLastMember = 0;
    var button = this.getForm().view.toolBar.getLeftMember(isc.OBToolbar.TYPE_ATTACHMENTS);
    if (!button) {
      button = this.getForm().view.toolBar.getLeftMember("attachExists");
    }
    button.customState = '';
    button.resetBaseStyle();
    //Deleting the upload message of the cancelled upload
    if (OB.Utilities.currentUploader) {
      canvas = window[OB.Utilities.currentUploader];
      if (canvas) {
        //The last member is the cancelled upload.
        positionOfLastMember = canvas.getMembers().size() - 1;
        //The first member is the Hlayout where the buttons are.
        if (positionOfLastMember > 0) {
          currentElement = canvas.getMembers()[positionOfLastMember];
          if (currentElement) {
            canvas.removeMember(currentElement);
          }
        }
      }
    }
  },
  fileExists: function (fileName, attachments) {
    var i, length;

    if (!attachments || attachments.length === 0) {
      return false;
    }

    length = attachments.length;
    for (i = 0; i < length; i++) {
      if (attachments[i].name === fileName) {
        return true;
      }
    }
    return false;
  },

  fillAttachments: function (attachments) {
    var id, i, length;

    this.savedAttachments = attachments;
    this.destroyAndRemoveMembers(this.getMembers());
    var hLayout = isc.HLayout.create();

    if (this.getForm().isNew) {
      return;
    }

    this.addMember(hLayout);
    var me = this;
    //Here we are checking if the entity is 'Organization' because the way of obtaining the
    //id of the organization of the form is different depending on the entity
    if (this.entity === 'Organization') {
      this.docOrganization = this.recordId;
    } else {
      this.docOrganization = this.attachmentForm.values.organization;
    }
    var addButton = isc.OBLinkButtonItem.create({
      title: '[ ' + OB.I18N.getLabel('OBUIAPP_AttachmentAdd') + ' ]',
      width: '30px',
      canvas: me,
      action: function (forceUpload) {
        var viewId = 'attachment_' + this.canvas.tabId,
            ownerView = this.canvas.getForm().view,
            standardWindow = ownerView.standardWindow,
            parts = standardWindow.getPrototype().Class.split('_'),
            clientContext = null,
            record = this.canvas.getForm().values,
            params = {},
            callback;
        if (OB.Utilities.currentUploader === null || forceUpload) {
          callback = function () {
            standardWindow.openProcess({
              paramWindow: true,
              processId: viewId,
              ownerView: ownerView,
              attachSection: me,
              windowTitle: OB.I18N.getLabel('OBUIAPP_AttachFile'),
              uiPattern: 'A'
            });
          };
          params.tabTitle = record[OB.Constants.IDENTIFIER];
          params.inpDocumentOrg = me.docOrganization;
          params.client = me.attachmentForm.values.client;
          if (parts.length === 3) {
            // is in development. add the timestamp to the parameters.
            params.timestamp = parts[2];
          }

          OB.Layout.ViewManager.fetchView(viewId, callback, clientContext, null, false, params);

          //Callback: creates metadata Fields, add them to form and executes popup.
/*
            var callback = function (rpcResponse, data, rpcRequest) {
              var metadataFields = [],
                  j;

              for (j = 0; j < data.attMetadataList.length; j++) {
                metadataFields[j] = isc.DynamicForm.create({
                  fields: [{
                    name: data.attMetadataList[j].SearchKey,
                    title: data.attMetadataList[j].Name,
                    type: 'text'
                  }]
                });
              }

              for (i = 0; i < metadataFields.length; i++) {
                form.addFields(metadataFields[i].fields[0]);
              }

              var popup = isc.OBAttachmentsSubmitPopup.create({
                submitButton: submitbutton,
                addForm: form
              });
              form.popup = popup;
              popup.show();
              };

          form = isc.DynamicForm.create({
            autoFocus: true,
            fields: [{
              name: 'inpname',
              title: attachmentFile,
              type: 'upload',
              multiple: false,
              canFocus: false
            }, {
              name: 'Command',
              type: 'hidden',
              value: 'SAVE_NEW_OB3'
            }, {
              name: 'buttonId',
              type: 'hidden',
              value: this.canvas.ID
            }, {
              name: 'inpKey',
              type: 'hidden',
              value: this.canvas.recordId
            }, {
              name: 'inpTabId',
              type: 'hidden',
              value: this.canvas.tabId
            }, {
              name: 'inpDocumentOrg',
              type: 'hidden',
              value: docOrganization
            }, {
              name: 'inpwindowId',
              type: 'hidden',
              value: this.canvas.windowId
            }, {
              name: 'viewId',
              type: 'hidden',
              value: this.canvas.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.view.ID
            }],
            encoding: 'multipart',
            action: './businessUtility/TabAttachments_FS.html',
            target: "background_target",
            numCols: 2,
            align: 'center',
            height: '30px',
            redraw: function () {},
            theCanvas: this.canvas
          });

          submitbutton = isc.OBFormButton.create({
            title: OB.I18N.getLabel('OBUIAPP_AttachmentSubmit'),
            theForm: form,
            canvas: me,
            click: function () {
              var fileName, form = this.theForm,
                  addFunction;
              addFunction = function (clickedOK) {
                if (clickedOK) {
                  var hTempLayout = isc.HLayout.create();
                  form.theCanvas.addMember(hTempLayout, form.theCanvas.getMembers().size());
                  var uploadingFile = isc.Label.create({
                    contents: fileName
                  });
                  var uploading = isc.Label.create({
                    className: 'OBLinkButtonItemFocused',
                    contents: '    ' + OB.I18N.getLabel('OBUIAPP_AttachmentUploading')
                  });
                  hTempLayout.addMember(uploadingFile);
                  hTempLayout.addMember(uploading);
                  var button = form.theCanvas.getForm().view.toolBar.getLeftMember(isc.OBToolbar.TYPE_ATTACHMENTS);
                  if (!button) {
                    button = form.theCanvas.getForm().view.toolBar.getLeftMember("attachExists");
                  }
                  button.customState = 'Progress';
                  button.resetBaseStyle();
                  if (OB.Utilities.currentUploader !== null) {
                    var origButton = window[OB.Utilities.currentUploader];
                    if (origButton && origButton.resetToolbar) {
                      origButton.resetToolbar();
                    }
                  }
                  OB.Utilities.currentUploader = form.theCanvas.ID;
                  form.submitForm();
                  form.popup.hide();
                }
              };
              var value = this.theForm.getItem('inpname').getElement().value;
              if (!value) {
                isc.say(OB.I18N.getLabel('OBUIAPP_AttachmentsSpecifyFile'));
                return;
              }
              value = value ? value : '';

              var lastChar = value.lastIndexOf("\\") + 1;

              fileName = lastChar === -1 ? value : value.substring(lastChar);

              if (this.theForm.theCanvas.fileExists(fileName, this.canvas.savedAttachments)) {
                isc.confirm(OB.I18N.getLabel('OBUIAPP_ConfirmUploadOverwrite'), addFunction);
              } else {
                addFunction(true);
              }
            }
          });

          //Calls Callback (INITIALIZE action) in order to create the form correctly and shows popup.
          OB.RemoteCallManager.call('org.openbravo.client.application.window.AttachmentsAH', {
            action: "INITIALIZE"
          }, {
            tabId: form.getItem('inpTabId').value
          }, callback);
*/
        } else {
          isc.ask(OB.I18N.getLabel('OBUIAPP_OtherUploadInProgress'), function (clickOK) {
            if (clickOK) {
              var forceUpload = true;
              this.button.action(forceUpload);
            }
          }, {
            button: this
          });
        }
      }
    });
    if (!this.getForm().view.viewForm.readOnly) {
      hLayout.addMember(addButton);
    }
    // If there are no attachments, we only display the "[Add]" button
    if (!attachments || attachments.length === 0) {
      this.getForm().getItem('_attachments_').setValue(OB.I18N.getLabel('OBUIAPP_AttachmentTitle'));
      this.getForm().view.attachmentExists = false;
      this.getForm().view.toolBar.updateButtonState();
      return;
    }
    this.getForm().view.attachmentExists = true;
    this.getForm().view.toolBar.updateButtonState();
    var fields = this.getForm().getFields();
    for (id = 0; id < fields.length; id++) {
      if (fields[id].type === 'OBAttachmentsSectionItem') {
        fields[id].setValue(OB.I18N.getLabel('OBUIAPP_AttachmentTitle') + " (" + attachments.length + ")");
      }
    }
    var downloadAllButton = isc.OBLinkButtonItem.create({
      title: '[ ' + OB.I18N.getLabel('OBUIAPP_AttachmentDownloadAll') + ' ]',
      width: '30px',
      canvas: this,
      action: function () {
        var canvas = this.canvas;
        isc.confirm(OB.I18N.getLabel('OBUIAPP_FormConfirmDownloadMultiple'), function (clickedOK) {
          if (clickedOK) {
            var d = {
              Command: 'GET_MULTIPLE_RECORDS_OB3',
              tabId: canvas.tabId,
              recordIds: canvas.recordId,
              viewId: canvas.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.view.ID
            };
            OB.Utilities.postThroughHiddenForm('./businessUtility/TabAttachments_FS.html', d);
          }
        });
      }
    });
    var removeAllButton = isc.OBLinkButtonItem.create({
      title: '[ ' + OB.I18N.getLabel('OBUIAPP_AttachmentRemoveAll') + ' ]',
      width: '30px',
      canvas: me,
      action: function () {
        var d = {
          Command: 'DELETE',
          tabId: this.canvas.tabId,
          buttonId: this.canvas.ID,
          recordIds: this.canvas.recordId,
          viewId: this.canvas.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.ID
        };
        var canvas = this.canvas;
        isc.confirm(OB.I18N.getLabel('OBUIAPP_ConfirmRemoveAll'), function (clickedOK) {
          if (clickedOK) {
            OB.RemoteCallManager.call('org.openbravo.client.application.window.AttachmentsAH', {}, d, function (response, data, request) {
              canvas.fillAttachments(data.attachments);
              if (data.status === -1) {
                OB.Utilities.writeErrorMessage(data.viewId, data.errorMessage);
              }
            });
          }
        }, {
          title: OB.I18N.getLabel('OBUIAPP_DialogTitle_RemoveAttachments')
        });
      }
    });
    hLayout.addMember(downloadAllButton);
    if (!this.getForm().view.viewForm.readOnly) {
      hLayout.addMember(removeAllButton);
    }

    var downloadActions;
    downloadActions = function () {
      var d = {
        Command: 'DISPLAY_DATA',
        inpcFileId: this.attachId,
        viewId: this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.ID
      };
      OB.Utilities.postThroughHiddenForm('./businessUtility/TabAttachments_FS.html', d);
    };

    var removeActions;
    removeActions = function () {
      var i, length, d = {
        Command: 'DELETE',
        tabId: this.canvas.tabId,
        buttonId: this.canvas.ID,
        recordIds: this.canvas.recordId,
        attachId: this.attachmentId,
        viewId: this.canvas.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.ID
      },
          canvas = this.canvas;

      isc.confirm(OB.I18N.getLabel('OBUIAPP_ConfirmRemove'), function (clickedOK) {
        if (clickedOK) {
          OB.RemoteCallManager.call('org.openbravo.client.application.window.AttachmentsAH', {}, d, function (response, data, request) {
            canvas.fillAttachments(data.attachments);
            if (data.status === -1) {
              OB.Utilities.writeErrorMessage(data.viewId, data.errorMessage);
            }
          });
        }
      }, {
        title: OB.I18N.getLabel('OBUIAPP_DialogTitle_RemoveAttachment')
      });
    };

    var editDescActions;
    editDescActions = function (fileName) {
      var form, submitbutton, popup, canvas = this.canvas;

      //callbackEdit: give us metadata fields filled with their previous values.
      var callbackEdit = function (rpcResponse, data, rpcRequest) {
          var metadataFields = [],
              j;

          for (j = 0; j < data.attMetadataList.length; j++) {
            metadataFields[j] = isc.DynamicForm.create({
              fields: [{
                name: data.attMetadataList[j].SearchKey,
                title: data.attMetadataList[j].Name,
                type: 'text',
                value: data.attMetadataList[j].value
              }]
            });
          }

          for (i = 0; i < metadataFields.length; i++) {
            form.addFields(metadataFields[i].fields[0]);
          }

          popup = isc.OBAttachmentsSubmitPopup.create({
            submitButton: submitbutton,
            addForm: form,
            title: OB.I18N.getLabel('OBUIAPP_AttachmentEditDesc')
          });
          form.popup = popup;
          popup.show();
          };



      form = isc.DynamicForm.create({
        autoFocus: true,
        fields: [{
          name: 'inpname',
          type: 'hidden',
          value: this.attachmentName
        }, {
          name: 'Command',
          type: 'hidden',
          value: 'EDIT'
        }, {
          name: 'buttonId',
          type: 'hidden',
          value: this.canvas.ID
        }, {
          name: 'inpKey',
          type: 'hidden',
          value: this.canvas.recordId
        }, {
          name: 'inpTabId',
          type: 'hidden',
          value: this.canvas.tabId
        }, {
          name: 'inpDocumentOrg',
          type: 'hidden',
          value: this.docOrganization
        }, {
          name: 'inpwindowId',
          type: 'hidden',
          value: this.canvas.windowId
        }, {
          name: 'inpAttachId',
          type: 'hidden',
          value: this.attachmentId
        }],
        encoding: 'multipart',
        action: './businessUtility/TabAttachments_FS.html',
        target: "background_target",
        numCols: 2,
        align: 'center',
        height: '30px',
        redraw: function () {},
        theCanvas: this.canvas
      });
      submitbutton = isc.OBFormButton.create({
        title: OB.I18N.getLabel('OBUIAPP_AttachmentSubmit'),
        theForm: form,
        canvas: me,
        click: function () {
          var fileName, form = this.theForm,
              addFunction, params;
          addFunction = function (clickedOK) {
            if (clickedOK) {
              var hTempLayout = isc.HLayout.create();
              form.theCanvas.addMember(hTempLayout, form.theCanvas.getMembers().size());
              var uploadingFile = isc.Label.create({
                contents: fileName
              });
              var uploading = isc.Label.create({
                className: 'OBLinkButtonItemFocused',
                contents: '    ' + OB.I18N.getLabel('OBUIAPP_AttachmentUploading')
              });
              hTempLayout.addMember(uploadingFile);
              hTempLayout.addMember(uploading);
              var button = form.theCanvas.getForm().view.toolBar.getLeftMember(isc.OBToolbar.TYPE_ATTACHMENTS);
              if (!button) {
                button = form.theCanvas.getForm().view.toolBar.getLeftMember("attachExists");
              }
              button.customState = 'Progress';
              button.resetBaseStyle();
              if (OB.Utilities.currentUploader !== null) {
                var origButton = window[OB.Utilities.currentUploader];
                if (origButton && origButton.resetToolbar) {
                  origButton.resetToolbar();
                }
              }
              OB.Utilities.currentUploader = form.theCanvas.ID;

              var itemsList = popup.items[0].members[0].members[0],
                  updatedValues = {};
              for (i = 0; i < itemsList.items.length; i++) {
                if ((itemsList.items[i].name !== "Command") & (itemsList.items[i].name !== "buttonId") & (itemsList.items[i].name !== "inpTabId") & (itemsList.items[i].name !== "inpAttachId") & (itemsList.items[i].name !== "inpname") & (itemsList.items[i].name !== "inpwindowId") & (itemsList.items[i].name !== "inpKey") & (itemsList.items[i].name !== "inpDocumentOrg")) {
                  if (itemsList.items[i]._value === null) {
                    updatedValues[itemsList.items[i].name] = encodeURIComponent("");
                  } else {
                    updatedValues[itemsList.items[i].name] = encodeURIComponent(itemsList.items[i]._value);
                  }
                }
              }

              params = {
                Command: 'EDIT',
                tabId: form.getItem('inpTabId').value,
                buttonId: form.getItem('buttonId').value,
                //recordIds: this.canvas.recordId,
                attachId: form.getItem('inpAttachId').value,
                //Now all metadata have to be sent.
                updatedMetadata: updatedValues,
                inpname: form.getItem('inpname').value,
                inpwindowId: form.getItem('inpwindowId').value,
                recordId: form.getItem('inpKey').value,
                viewId: form.theCanvas.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.ID
              };

              form.popup.hide();
              OB.RemoteCallManager.call('org.openbravo.client.application.window.AttachmentsAH', {}, params, function (response, data, request) {
                OB.Utilities.uploadFinished(data.buttonId, data);
                if (data.status === -1) {
                  OB.Utilities.writeErrorMessage(data.viewId, data.errorMessage);
                }
              });
            }
          };
          var value = this.theForm.getItem('inpname').getElement().value;
          addFunction(true);
        }
      });

      //Calls callback with INITIALIZE_EDIT action.
      OB.RemoteCallManager.call('org.openbravo.client.application.window.AttachmentsAH', {
        action: "INITIALIZE_EDIT",
        attachId: form.getItem('inpAttachId').value
      }, {
        tabId: form.getItem('inpTabId').value
      }, callbackEdit);
    };

    length = attachments.length;
    for (i = 0; i < attachments.length; i++) {
      var attachment = attachments[i];
      var buttonLayout = isc.HLayout.create();
      var attachmentLabel = isc.Label.create({
        contents: attachment.name.asHTML(),
        className: 'OBNoteListGrid',
        width: '200px',
        height: 20,
        wrap: false
      });
      var creationDate = OB.Utilities.getTimePassedInterval(attachment.age);
      var attachmentBy = isc.Label.create({
        height: 1,
        className: 'OBNoteListGridAuthor',
        width: '200px',
        contents: creationDate + " " + OB.I18N.getLabel('OBUIAPP_AttachmentBy') + " " + attachment.updatedby
      });
      var downloadAttachment = isc.OBLinkButtonItem.create({
        title: '[ ' + OB.I18N.getLabel('OBUIAPP_AttachmentDownload') + ' ]',
        width: '30px',
        attachmentName: attachment.name,
        attachId: attachment.id,
        action: downloadActions
      });
      downloadAttachment.height = 0;
      var removeAttachment = isc.OBLinkButtonItem.create({
        title: '[ ' + OB.I18N.getLabel('OBUIAPP_AttachmentRemove') + ' ]',
        width: '30px',
        attachmentName: attachment.name,
        attachmentId: attachment.id,
        canvas: this,
        action: removeActions
      });

      var editDescription = isc.OBLinkButtonItem.create({
        title: '[ ' + OB.I18N.getLabel('OBUIAPP_AttachmentEditDesc') + ' ]',
        width: '30px',
        attachmentName: attachment.name,
        attachmentId: attachment.id,
        canvas: this,
        action: editDescActions,
        hLayout: buttonLayout
      });
      var description = isc.DynamicForm.create({
        title: 'Description',
        numCols: 1,
        width: '100%',
        canvas: this,
        fields: [{
          name: 'descriptionOBTextAreaItem',
          type: 'OBTextAreaItem',
          showTitle: false,
          layout: this,
          width: '*',
          length: 2000,
          value: attachment.description,
          disabled: true
        }]
      });

      buttonLayout.description = description.fields[0].value;
      buttonLayout.addMember(attachmentLabel);
      buttonLayout.addMember(attachmentBy);
      buttonLayout.addMember(downloadAttachment);
      if (!this.getForm().view.viewForm.readOnly) {
        buttonLayout.addMember(removeAttachment);
      }
      buttonLayout.addMember(editDescription);
      buttonLayout.addMember(description);
      this.addMember(buttonLayout);
    }
  },

  // ensure that the view gets activated
  focusChanged: function () {
    var view = this.getForm().view;
    if (view && view.setAsActiveView) {
      view.setAsActiveView();
    }
    return this.Super('focusChanged', arguments);
  }
});