function setAttrValue(attributeCode, attributeValue, attributeText) {
  debugger;
  var attribute = EdocsApi.getAttributeValue(attributeCode);
  attribute.value = attributeValue;
  attribute.text = attributeText;
  EdocsApi.setAttributeValue(attribute);
}

function onSearchDepartment(request) {
  request.filterCollection.push({
    attributeCode: "Quantity",
    value: "1",
  });
}

function onSearchNamePosition(request) {
  var Department = EdocsApi.getAttributeValue("Department").text;
  if (Department) {
    request.filterCollection.push({
      attributeCode: "Title",
      value: Department,
    });
  }
}

function onChangeDepartment() {
  debugger;
  if (!EdocsApi.getAttributeValue("Department").text) setAttrValue("NamePosition", "", "");
}

function onBeforeCardSave() {
  setDateSTR("RegDate", "RegDateText");
  setCommissionMember3();
}

function setCommissionMember3() {
  var employeeId = EdocsApi.getAttributeValue("Signatory")?.value;
  if (employeeId) {
    setAttrValue("CommissionMember3", "1");
  } else {
    setAttrValue("CommissionMember3", "0");
  }
}

//-------------------------------
// еСайн
//-------------------------------
function setDataForESIGN() {
  debugger;
  var regDate = EdocsApi.getAttributeValue("RegDate").value;
  var regNumber = EdocsApi.getAttributeValue("RegNumber").value;
  var name = "№" + (regNumber ? regNumber : CurrentDocument.id) + (!regDate ? "" : " від " + moment(regDate).format("DD.MM.YYYY"));
  doc = {
    docName: name,
    extSysDocId: CurrentDocument.id,
    ExtSysDocVersion: CurrentDocument.version,
    docType: "commissionDecision",
    parties: [
      {
        taskType: "ToSign",
        taskState: "Done",
        legalEntityCode: EdocsApi.getAttributeValue("OrgEDRPOU").value,
        contactPersonEmail: EdocsApi.getEmployeeDataByEmployeeID(CurrentDocument.initiatorId).email,
        signatures: [],
      },
      {
        taskType: "ToSign",
        taskState: "NotAssigned",
        legalEntityCode: EdocsApi.getAttributeValue("SignatoryEmail").value,
        contactPersonEmail: EdocsApi.getAttributeValue("SignatoryEmail").value,
        expectedSignatures: [],
      },
    ],
    sendingSettings: {
      attachFiles: "fixed",
      attachSignatures: "signatureAndStamp",
    },
  };

  addSignatotyParies(EdocsApi.getAttributeValue("Commissioner6Email").value, doc.parties);
  addSignatotyParies(EdocsApi.getAttributeValue("Commissioner7Email").value, doc.parties);
  addSignatotyParies(EdocsApi.getAttributeValue("Commissioner8Email").value, doc.parties);

  EdocsApi.setAttributeValue({ code: "LSDJSON", value: JSON.stringify(doc) });
}

function addSignatotyParies(signatoty, parties) {
  if (Signatoty) {
    return parties.push({
      taskType: "ToSign",
      taskState: "NotAssigned",
      legalEntityCode: signatoty,
      contactPersonEmail: signatoty,
      expectedSignatures: [],
    });
  }
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult != "rejected") {
    if (!EdocsApi.getAttributeValue("SignatoryEmail").value) throw `Не заповнено поле "E-mail Члена комісії 3"`;
    setDataForESIGN();

    var methodData = {
      extSysDocId: CurrentDocument.id,
      ExtSysDocVersion: CurrentDocument.version,
    };
    routeStage.externalAPIExecutingParams = {
      externalSystemCode: "ESIGN",
      externalSystemMethod: "integration/importDoc",
      data: methodData,
      executeAsync: true,
    };
  }
}

function onTaskCommentedSendOutDoc(caseTaskComment) {
  //debugger;
  var orgCode = EdocsApi.getAttributeValue("OrgEDRPOU").value;
  var orgShortName = EdocsApi.getAttributeValue("OrgName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var isCaceling = caseTaskComment.comment && caseTaskComment.comment.toLowerCase().startsWith("#cancel#");
  if (isCaceling) {
    caseTaskComment.comment = caseTaskComment.comment.slice(8);
  }
  var methodData = {
    extSysDocId: CurrentDocument.id,
    // extSysDocVersion: CurrentDocument.version,
    eventType: isCaceling ? "CancelProcessing" : "CommentAdded",
    comment: caseTaskComment.comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };
  caseTaskComment.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN",
    externalSystemMethod: "integration/processEvent",
    data: methodData,
    executeAsync: true,
  };
}

function setDateSTR(DateCODE, TXTcode) {
  debugger;
  var Date = EdocsApi.getAttributeValue(DateCODE).value;
  var txt = null;
  if (Date) txt = moment(Date).format("DD.MM.YYYY");
  if (txt != EdocsApi.getAttributeValue(TXTcode).value) EdocsApi.setAttributeValue({ code: TXTcode, value: txt, text: null });
}
