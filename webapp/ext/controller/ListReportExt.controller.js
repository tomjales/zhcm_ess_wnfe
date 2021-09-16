sap.ui.controller("zhcmess.zhcmesswnfe.ext.controller.ListReportExt", {
	onInit: function (oEvent) {
        var oView = this.getView();
		var a = 5;
		//       var oOwnerComponent = this.getOwnerComponent();
	},
	onExit: function (oEvent) {
		var oView = this.getView();
		var a = 5;
	},
	onBeforeRendering: function (oEvent) {
		var oView = this.getView();
		var a = 5;

	},
	onAfterRendering: function () {
		var oView = this.getView();
		var a = 5;
	},
	OnSelectionA: function (oEvent) {
		this.OnSelection(oEvent, "A")
	},
	OnSelection : function (oEvent, oUserAction) {
		var aContexts = this.extensionAPI.getSelectedContexts();
		//Perform Action
		var oView = this.getView();
		var oModel = oView.getModel();
		// sprawdzi, czy jest dyrektor i wybrali jakieś NADG.
		this.DashboardHeaderSetModel = new sap.ui.model.json.JSONModel( {
			"ACTION": oUserAction
		});
		this.DashboardHeaderSetModel.getData().DashboardListSet = [];
		var aRequests = [];
		var oArray = [];
		var aDashboardHeaderRecord = {
		};
		var oReqID = "";
		for (let i = 0; i < aContexts.length; i++) {
			let oStri = aContexts[i].sPath; //"/DashboardListSet(ID='ID%202',REQUEST_TYPE='REQUEST_TYPE%202',WF_ID='WF_ID%202',REQUEST_STATUS='REQUEST_STATUS%202')"
			let i_I = oStri.indexOf("NADG");
			if (i_I === - 1) {
				continue ;
			} // nie ma
			oArray = oStri.split(",");
			oReqID = oArray[2]; //,WF_ID='WF_ID%202'
			oReqID = oReqID.replace("WF_ID='", "");
			oReqID = oReqID.replace("'", "");
			// tu się wstawia %2F zamiast / i jest problem, bo wychodzi za długie.
			oReqID = oReqID.replace(/%2F/g, "/");
			aDashboardHeaderRecord = {
			};
			aDashboardHeaderRecord.WF_ID = oReqID;
			this.DashboardHeaderSetModel.getData().DashboardListSet.push(aDashboardHeaderRecord);
			aRequests.push(oReqID)
		}; // koniec for
		that = this;
		var oResourceBundle = oView.getModel("i18n").getResourceBundle();
		if (aRequests.length === 0) {
			var oText = oResourceBundle.getText("nienadgo");
			let oStri = new sap.m.Text( {
				text: oText
			});
			var oContent = [];
			oContent.push(oStri);
			var oTytul = oResourceBundle.getText("kontroladanych");
			that.dispMessages(true, oTytul, oContent);
			return ;
		};
		// teraz rola dyrektor, reszta w środku.
		//To ma być resolve i reject dla czytania roli.
		this.rolaRead().then(
		//success rolaRead
			function (oRecord, _result) {
			var bMultiAccept = oRecord.MULTI_BTN_VISIBLE;
			if (bMultiAccept === false) {
				var oText = oResourceBundle.getText("nietarola");
				let oStri = new sap.m.Text( {
					text: oText
				});
				var oContent = [];
				oContent.push(oStri);
				var oTytul = oResourceBundle.getText("kontroladanych");
				that.dispMessages(true, oTytul, oContent)
			}
			else {
				//To ma być resolve i reject dla aktualizacji zbiorczej.                    
				that.acceptCreate().then(
				//success acceptCreate
					function (oData, response) {
					var oText = oResourceBundle.getText("wnioskiakce");
					let oStri = new sap.m.Text( {
						text: oText
					});
					var oContent = [];
					oContent.push(oStri);
					var oTytul = oResourceBundle.getText("zbiorczyok");
					that.dispMessages(false, oTytul, oContent);
				},
				//error acceptCreate
					function (oError) {
					var oContent = [];
					oContent = that.prepErrMessages(oError);
					var oTytul = oResourceBundle.getText("zbiorczynieok");
					that.dispMessages(true, oTytul, oContent)
				}); //koniec resolve i reject dla aktualizacji zbiorczej.     
			} //koniec else
		}, // koniec success rolaRead                
		//error rolaRead          
			function (oError) {
			var oText = oResourceBundle.getText("rolanieok");
			let oStri = new sap.m.Text( {
				text: oText
			});
			var oContent = [];
			oContent.push(oStri);
			var oTytul = oResourceBundle.getText("kontroladanych");
			that.dispMessages(true, oTytul, oContent);
		});
	},

	// odtąd definicje Promises
	rolaRead: function () {
		return new Promise(function (rolaResolve, rolaReject) {
			var oView = that.getView();
			var oModel = oView.getModel();
			oModel.read("/AttributesSet('01')", {
				success: function (oRecord, _result) {
					rolaResolve(oRecord, _result);
				},
				error: function (oError, result) {
					rolaReject(oError, result);
				}
			});
		});
	},
	acceptCreate: function () {
		return new Promise(function (acceptResolve, acceptReject) {
			var oView = that.getView();
			var oModel = oView.getModel();
			var oCoto = that.DashboardHeaderSetModel.getData();
			oModel.create("/DashboardHeaderSet", oCoto, {
				success: function (oRecord, _result) {
					acceptResolve(oRecord, _result);
				},
				error: function (oError, result) {
					acceptReject(oError, result);
				}
			});
		});
	},

	// reszta 
	prepErrMessages: function (oError) {
		var responseText = JSON.parse(oError.responseText);
		var rTE = responseText.error;
		var rTEI = rTE.innererror;  // przy okazji skrócić - pewnie nie będzie okazji
		var msgDet = [];
		oContent = [];
		msgDet = rTEI.errordetails; //Array(n) i dotąd jest OK.
		for (let i = 0; i < msgDet.length; i++) {
			let oStri = new sap.m.Text( {
				text: msgDet[i].message
			});
			oContent.push(oStri)
		}; //koniec for.
		return oContent
	},
	dispMessages: function (iBlad, oTytul, oContent) {
		var oState;
		if (iBlad == true)
			oState = sap.ui.core.ValueState.Error;
		else
			oState = sap.ui.core.ValueState.Success;
		if (!that.oErrorMessageDialog) {
			that.oErrorMessageDialog = new sap.m.Dialog( {
				type: sap.m.DialogType.Message,
				title: oTytul,
				contentWidth: "30%",   // "1px" or "2em" or "50%". 
				state: oState, //sap.ui.core.ValueState.Success,
				content: oContent,
				beginButton: new sap.m.Button( {
					type: sap.m.ButtonType.Emphasized,
					text: "OK",
					press: function () {
						that.oErrorMessageDialog.close();
					}.bind(that)
				})
			});
		}
		that.oErrorMessageDialog.open();
    },
    formatLink: function(sLink) {
            if (typeof sLink === "undefined") 
               { return "NIE MA" }
            var oView = this.getView();               
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();
			var oText = oResourceBundle.getText("URL");
			return oText
    },
    formatColumnWyswietl: function(sText) {
            var oView = this.getView();               
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();
			var oText = oResourceBundle.getText("Wyswietl"); 
			return oText
    },
    formatColumnDrukuj: function(sText) {
            var oView = this.getView();               
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();
			var oText = oResourceBundle.getText("Drukuj"); 
			return oText
    },
    formatColumnKopiuj: function(sText) {
            var oView = this.getView();               
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();
			var oText = oResourceBundle.getText("Kopiuj"); 
			return oText
	}
});
