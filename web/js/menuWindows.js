/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2001-2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/
<!-- Codigo JavaScript

var classOpened = "Icon_folderOpened";
var classClosed = "Icon_folderClosed";
var isOpened = false;
var focusedMenuElement = null;
var isGoingDown = null;
var firstGoingDown = null;
var isGoingUp = null;
var firstGoingUp = null;

function getReference(id) {
  if (document.getElementById) return document.getElementById(id);
  else if (document.all) return document.all[id];
  else if (document.layers) return document.layers[id];
  else return null;
}

function getStyle(id, esId) {
  var ref;
  if (esId==null || esId) ref = getReference(id);
  else ref = id;
  try {
    return ((document.layers) ? ref : ref.style);
  } catch(e) {}
  return null;
}

function cambiarSituacion(evt, elemento) {
  if(elemento == null) {
    elemento = (!document.all) ? evt.target : event.srcElement;
  } else if (evt == null) {
    elemento = elemento.lastChild;
    for (;;) {
      if (elemento.nodeType != '1') {
        elemento = elemento.previousSibling; // TR0_1
      } else {
        break;
      }
    }
  }
  if (elemento.tagName == 'IMG') elemento = elemento.parentNode;
  if (elemento.parentNode.className.indexOf("NOT_Hover NOT_Selected NOT_Pressed") != -1) {
    setMenuElementFocus(elemento.parentNode);
  }  
  var indice = null;
  if (document.all) indice = elemento.sourceIndex;
  var hijo=null;
  var total = "";
  try {
    if (elemento.id.indexOf("folder")==-1 && elemento.id.indexOf("folderCell")==-1 && elemento.id.indexOf("folderImg")==-1) {
      if (element.onclick) return elemento.onclick();
      else return true;
    } else if (elemento.id.indexOf("folderNoChilds")==0) return true;
    else if (elemento.id.indexOf("folderCell1")==0) total = elemento.id.replace("folderCell1_", "");
    else if (elemento.id.indexOf("folderCell2")==0) total = elemento.id.replace("folderCell2_", "");
    else if (elemento.id.indexOf("folderImg")==0) total = elemento.id.replace("folderImg", "");
    else total = elemento.id.replace("folder","");
  } catch (e) {}
  hijo = getReference("parent" + total);
  var actualclass = getObjectClass("folderImg" + total);
  var selectedClass = getObjectClass("child" + total);
  if (selectedClass==null) selectedClass = "";
  selectedClass = selectedClass.replace(" Opened", " NOT_Opened");
  var obj = getStyle(hijo, false);
  if (!obj) return;
  try {
    if (obj.display=="none") {
      obj.display="";
      actualclass = actualclass.replace(classClosed, classOpened);
      setClass("folderImg" + total, actualclass);
      selectedClass = selectedClass.replace(" NOT_Opened", " Opened");
      setClass("child" + total, selectedClass);
    } else {
      obj.display="none";
      actualclass = actualclass.replace(classOpened, classClosed);
      setClass("folderImg" + total, actualclass);
      selectedClass = selectedClass.replace(" Opened", " NOT_Opened");
      setClass("child" + total, selectedClass);
    }
  } catch (ignored) {}  
  return false;
}

function checkSelected(id) {

}


document.onclick=cambiarSituacion;

if (document.layers) {
  window.captureEvents(Event.ONCLICK);
  window.onclick=cambiarSituacion;
}

function setMouseOver(obj) {
  var actualclass = obj.className;
  obj.className = obj.className.replace(' NOT_Hover', ' Hover');
  return true;
}

function setMouseOut(obj) {
  var actualclass = obj.className;
  obj.className = obj.className.replace(' Hover', ' NOT_Hover');
  obj.className = obj.className.replace(' Pressed', ' NOT_Pressed');  
  return true;
}

function setMouseDown(obj) {
  var actualclass = obj.className;
  obj.className = obj.className.replace(' Hover', ' NOT_Hover');  
  obj.className = obj.className.replace(' NOT_Pressed', ' Pressed');
  return true;
}

function setMouseUp(obj) {
  var actualclass = obj.className;
  obj.className = obj.className.replace(' Pressed', ' NOT_Pressed');
  return true;
}

//-->
//key control

function activateElement(obj){
  var jump = false;
  if (obj.className.indexOf(" NOT_Opened")!=-1) {
    cambiarSituacion(null, obj);
    //obj.onclick();  //With this value the window will be opened
  } else {
    setMenuElementFocus(getNextMenuElement(focusedMenuElement));
  }
  return true;
}

function desactivateElement(obj){
  if (obj.className.indexOf(" Opened")!=-1) {
    cambiarSituacion(null, obj);
  } else {
    var obj = getMenuElementParent(focusedMenuElement);
    setMenuElementFocus(obj);
  }
}

function getFirstMenuElement() {
  var firstElement;
  firstElement = document.getElementById('paramMenu');   //TABLE
  firstElement = firstElement.firstChild;
  for (;;) {
    if (firstElement.nodeType != '1') {
      firstElement = firstElement.nextSibling; // TBODY
    } else {
      break;
    }
  }
  firstElement = firstElement.firstChild;
  for (;;) {
    if (firstElement.nodeType != '1') {
      firstElement = firstElement.nextSibling; // TR0
    } else {
      break;
    }
  }
  firstElement = firstElement.firstChild;
  for (;;) {
    if (firstElement.nodeType != '1') {
      firstElement = firstElement.nextSibling; // TD
    } else {
      break;
    }
  }
  firstElement = firstElement.firstChild;
  for (;;) {
    if (firstElement.nodeType != '1') {
      firstElement = firstElement.nextSibling; // TABLE
    } else {
      break;
    }
  }
  firstElement = firstElement.firstChild;
  for (;;) {
    if (firstElement.nodeType != '1') {
      firstElement = firstElement.nextSibling; // TBODY
    } else {
      break;
    }
  }
  firstElement = firstElement.firstChild;
  for (;;) {
    if (firstElement.nodeType != '1') {
      firstElement = firstElement.nextSibling; // TR1
    } else {
      break;
    }
  }
  return firstElement;

}

function getLastMenuElement() {
  var lastElement;
  lastElement = document.getElementById('paramMenu');   //TABLE globlal
  for (;;) {
    lastElement = lastElement.firstChild;
    for (;;) {
      if (lastElement.nodeType != '1') {
        lastElement = lastElement.nextSibling; // TBODY global
      } else {
        break;
      }
    }
    lastElement = lastElement.lastChild;
    for (;;) {
      if (lastElement.nodeType != '1') {
        lastElement = lastElement.previousSibling; // TR0_1
      } else {
        break;
      }
    }
    for(;;) {
      lastElement = lastElement.firstChild;
      for (;;) {
        if (lastElement.nodeType != '1') {
          lastElement = lastElement.nextSibling; // TD_1
        } else {
          break;
        }
      }

      if (lastElement.style.display == 'none') {
        lastElement = lastElement.parentNode; //TR0_1
        lastElement = lastElement.previousSibling;
        for (;;) {
          if (lastElement.nodeType != '1') {
            lastElement = lastElement.previousSibling; // TR0_2
          } else {
            break;
          }
        }
      } else {
        break;
      }
    }
    if (lastElement.getAttribute('id')) {
      //down a level
      lastElement = lastElement.firstChild;
      for (;;) {
        if (lastElement.nodeType != '1') {
          lastElement = lastElement.nextSibling; // TABLE
        } else {
          break;
        }
      }
    } else {
      break;
    }
  }
  lastElement = lastElement.firstChild;
  for (;;) {
    if (lastElement.nodeType != '1') {
      lastElement = lastElement.nextSibling; // TABLE
    } else {
      break;
    }
  }
  lastElement = lastElement.firstChild;
  for (;;) {
    if (lastElement.nodeType != '1') {
      lastElement = lastElement.nextSibling; // TBODY
    } else {
      break;
    }
  }
  lastElement = lastElement.firstChild;
  for (;;) {
    if (lastElement.nodeType != '1') {
      lastElement = lastElement.nextSibling; // TR1
    } else {
      break;
    }
  }
  return lastElement;
}

function getNextMenuElement(obj) {
  var error = false;
  if (obj==null || obj=='null' || obj=='') {
    var firstElementObj = getFirstMenuElement();
    return firstElementObj;
  }
  // TR0 TD TABLE TBODY TR1
  var nextElementTmp;
  var nextElement = obj; // TR1_1;
  nextElement = nextElement.parentNode; // TBODY_1
  nextElement = nextElement.parentNode; // TABLE_1
  nextElement = nextElement.parentNode; // TD_1

  if (nextElement.style.display == 'none') {
    nextElement.style.display == 'block'
  }

  nextElement = nextElement.parentNode; // TR0_1
  
  nextElementTmp = nextElement;

  for (;;) {
    try {
      for (;;) {
        nextElement = nextElement.nextSibling; // TR0_2
        if (nextElement.nodeType == '1') {
          break;
        }
      }
      nextElement = nextElement.firstChild;
      for (;;) {
        if (nextElement.nodeType != '1') {
          nextElement = nextElement.nextSibling; // TD_2
        } else {
          break;
        }
      }
      if (nextElement.style.display != 'none') {
        nextElement = nextElement.parentNode; //TR0_2
        break;
      } else {
        nextElement = nextElement.parentNode; //TR0_2
      }
    } catch (e) {
      try {
        nextElement = nextElementTmp;
        // up a level
        nextElement = nextElement.parentNode; // TBODY_1
        nextElement = nextElement.parentNode; // TABLE_1
        nextElement = nextElement.parentNode; // TD_1
        nextElement = nextElement.parentNode; // TR0_1
        nextElementTmp = nextElement;
      } catch (e) {
        error=true;
        break;
      }
    }
  }
  if (error==true) {
    return obj;
  }
  nextElement = nextElement.firstChild;
  for (;;) {
    if (nextElement.nodeType != '1') {
      nextElement = nextElement.nextSibling; // TD_2
    } else {
      break;
    }
  }



  for (;;) {
    if (nextElement.style.display == 'none') {
      nextElement = nextElement.parentNode; // TR0_2
      for (;;) {
        if (nextElement.nodeType != '1') {
          nextElement = nextElement.nextSibling; // TR0_3
        } else {
          break;
        }
      }
      nextElement = nextElement.firstChild;
      for (;;) {
        if (nextElement.nodeType != '1') {
          nextElement = nextElement.nextSibling; // TD_3
        } else {
          break;
        }
      }
    } else {
      if (nextElement.getAttribute('id')) { // down a level
        nextElement = nextElement.firstChild;
        for (;;) {
          if (nextElement.nodeType != '1') {
            nextElement = nextElement.nextSibling; // TABLE_2 (it doesn't content a final TR)
          } else {
            break;
          }
        }
        nextElement = nextElement.firstChild;
        for (;;) {
          if (nextElement.nodeType != '1') {
            nextElement = nextElement.nextSibling; // TBODY_2
          } else {
            break;
          }
        }
        nextElement = nextElement.firstChild; 
        for (;;) {
          if (nextElement.nodeType != '1') {
            nextElement = nextElement.nextSibling; // TR1_2 (it doesn't contennt the element)
          } else {
            break;
          }
        }
        nextElement = nextElement.firstChild;
        for (;;) {
          if (nextElement.nodeType != '1') {
            nextElement = nextElement.nextSibling; // TD2_2 (equivalent to TD_2, but one level below, so it content a final TABLE)
          } else {
            break;
          }
        }
      }
      for (;;) {
        if (nextElement.style.display == 'none') {
          nextElementTmp = nextElement;
          try {
            nextElement = nextElement.parentNode; // TR0_2
            nextElement = nextElement.nextSibling;
            for (;;) {
              if (nextElement.nodeType != '1') {
                nextElement = nextElement.nextSibling; // TR0_3
              } else {
                break;
              }
            }
            nextElement = nextElement.firstChild;
            for (;;) {
              if (nextElement.nodeType != '1') {
                nextElement = nextElement.nextSibling; // TD_3
              } else {
                break;
              }
            }
          } catch (e) {
            break;
          }
        } else {
          break;
        }
      }
      break;
    }
  }
  nextElement = nextElement.firstChild;
  for (;;) {
    if (nextElement.nodeType != '1') {
      nextElement = nextElement.nextSibling; // TABLE_3
    } else {
      break;
    }
  }
  nextElement = nextElement.firstChild;
  for (;;) {
    if (nextElement.nodeType != '1') {
      nextElement = nextElement.nextSibling;  // TBODY_3
    } else {
      break;
    }
  }
  nextElement = nextElement.firstChild; // TR1_3

  return nextElement;
}

function getPreviousMenuElement(obj) {
  var error = false;
  if (obj==null || obj=='null' || obj=='') {
    var lastElementObj = getLastMenuElement();
    return lastElementObj;
  }
  // TR0 TD TABLE TBODY TR1
  var previousElementTmp;
  var previousElement = obj; // TR1_1;
  previousElement = previousElement.parentNode; // TBODY_1
  previousElement = previousElement.parentNode; // TABLE_1
  previousElement = previousElement.parentNode; // TD_1

  if (previousElement.style.display == 'none') {
    previousElement.style.display == 'block'
  }

  previousElement = previousElement.parentNode; // TR0_1

  
  previousElementTmp = previousElement;

  for (;;) {
    try {
      for (;;) {
        previousElement = previousElement.previousSibling; // TR0_2
        if (previousElement.nodeType == '1') {
          break;
        }
      }
      
      previousElement = previousElement.lastChild;
      for (;;) {
        if (previousElement.nodeType != '1') {
          previousElement = previousElement.previousSibling; // TD_2
        } else {
          break;
        }
      }
      if (previousElement.style.display != 'none') {
        previousElement = previousElement.parentNode; //TR0_2
        break;
      } else {
        previousElement = previousElement.parentNode; //TR0_2
      }
    } catch (e) {
      previousElement = previousElementTmp;
      // up a level
      previousElement = previousElement.parentNode; // TBODY_1
      previousElement = previousElement.parentNode; // TABLE_1
      previousElement = previousElement.parentNode; // TD_1
      previousElement = previousElement.parentNode; // TR0_1
      previousElementTmp = previousElement;
    }
  }


  previousElement = previousElement.firstChild;
  for (;;) {
    if (previousElement.nodeType != '1') {
      previousElement = previousElement.nextSibling; // TD_2
    } else {
      break;
    }
  }

  for (;;) {
    if (previousElement.getAttribute('id')) { // down a level
    //alert('caso');
      previousElement = previousElement.firstChild;
      for (;;) {
        if (previousElement.nodeType != '1') {
          previousElement = previousElement.nextSibling; // TABLE_2 (it doesn't content a final TR)
        } else {
          break;
        }
      }
      previousElement = previousElement.firstChild;
      for (;;) {
        if (previousElement.nodeType != '1') {
          previousElement = previousElement.nextSibling; // TBODY_2
        } else {
          break;
        }
      }
      previousElement = previousElement.lastChild; 
      for (;;) {
        if (previousElement.nodeType != '1') {
          previousElement = previousElement.previousSibling; // TR1_2 (it doesn't contennt the element)
        } else {
          break;
        }
      }
      previousElement = previousElement.firstChild;
      for (;;) {
        if (previousElement.nodeType != '1') {
          previousElement = previousElement.nextSibling; // TD2_2 (equivalent to TD_2, but one level below, so it content a final TABLE)
        } else {
          break;
        }
      }
    }

    for (;;) {
      if (previousElement.style.display == 'none') {
        previousElementTmp = previousElement;
        try {
          previousElement = previousElement.parentNode; // TR0_2
          previousElement = previousElement.previousSibling;
          for (;;) {
            if (previousElement.nodeType != '1') {
              previousElement = previousElement.previousSibling; // TR0_3
            } else {
              break;
            }
          }
          previousElement = previousElement.firstChild;
          for (;;) {
            if (previousElement.nodeType != '1') {
              previousElement = previousElement.nextSibling; // TD_3
            } else {
              break;
            }
          }
        } catch (e) {
          break;
        }
      } else {
        break;
      }
    }
    if (!previousElement.getAttribute('id')) break;
  }

  previousElement = previousElement.firstChild;
  for (;;) {
    try {      
      if (previousElement.nodeType != '1') {
        previousElement = previousElement.nextSibling; // TABLE_3
      } else {
        break;
      }
    } catch (e) {
      error=true;
      break;
    }
  }

  if (error==true) {
    return obj;
  }

  previousElement = previousElement.firstChild;
  for (;;) {
    if (previousElement.nodeType != '1') {
      previousElement = previousElement.nextSibling;  // TBODY_3
    } else {
      break;
    }
  }
  previousElement = previousElement.firstChild; // TR1_3

  return previousElement;
}

function getMenuElementParent(obj) {
  if (obj==null || obj=='null' || obj=='') {
    return false;
  }
  var parentElement = obj; // TR1_1;
  parentElement = parentElement.parentNode; // TBODY_1
  parentElement = parentElement.parentNode; // TABLE_1
  parentElement = parentElement.parentNode; // TD_1
  parentElement = parentElement.parentNode; // TR0_1
  parentElement = parentElement.parentNode; // TBODY_1
  parentElement = parentElement.parentNode; // TABLE_1
  parentElement = parentElement.parentNode; // TD_1
  parentElement = parentElement.parentNode; // TR0_1
  parentElement = parentElement.previousSibling;
  for (;;) {
    if (parentElement.nodeType != '1') {
      parentElement = parentElement.previousSibling;  // TR0_2
    } else {
      break;
    }
  }
  parentElement = parentElement.firstChild;
  for (;;) {
    if (parentElement.nodeType != '1') {
      parentElement = parentElement.nextSibling;  // TD_2
    } else {
      break;
    }
  }
  parentElement = parentElement.firstChild;
  for (;;) {
    if (parentElement.nodeType != '1') {
      parentElement = parentElement.nextSibling;  // TABLE_2
    } else {
      break;
    }
  }
  parentElement = parentElement.firstChild;
  for (;;) {
    if (parentElement.nodeType != '1') {
      parentElement = parentElement.nextSibling;  // TBODY_2
    } else {
      break;
    }
  }
  parentElement = parentElement.firstChild;
  for (;;) {
    if (parentElement.nodeType != '1') {
      parentElement = parentElement.nextSibling;  // TR1_2
    } else {
      break;
    }
  }

  return parentElement;
}

function putMenuElementFocus(obj) {
  var actualclass = obj.className;
  obj.className = obj.className.replace(' NOT_Selected', ' Selected');
  return true;
}

function removeMenuElementFocus(obj) {
  var actualclass = obj.className;
  obj.className = obj.className.replace(' Selected', ' NOT_Selected');
  return true;
}

function getMenuElementOffsetTop(obj){
  var menuTopHeight = document.getElementById("MenuTop").clientHeight + document.getElementById("MenuTop2").clientHeight;
  elementOffsetTop=0;
  try {
    while (obj.tagName != "BODY") {
      elementOffsetTop += obj.offsetTop;
      if (obj.offsetParent !=null) {
        obj = obj.offsetParent;
      }
    }
    elementOffsetTop = elementOffsetTop - menuTopHeight;
  } catch (e) {
  }
  return elementOffsetTop;
}

function setMenuElementFocus(obj) {
  var menuScrollTop = document.getElementById('Menu_Client').scrollTop;
  var menuScrollHeight = document.getElementById('Menu_Client').scrollHeight;
  var menuHeight = document.getElementById("Menu_Client").clientHeight;
  var elementOffsetTop_top = getMenuElementOffsetTop(obj) - menuScrollTop;
  var elementOffsetTop_bottom = getMenuElementOffsetTop(obj) + obj.clientHeight - menuScrollTop;

  while(elementOffsetTop_top < 0){
    document.getElementById('Menu_Client').scrollTop -= 1;
    menuScrollTop = document.getElementById('Menu_Client').scrollTop;
    menuHeight = document.getElementById("Menu_Client").clientHeight;
    elementOffsetTop_top = getMenuElementOffsetTop(obj) - menuScrollTop;
  }

  while(elementOffsetTop_bottom > menuHeight){
    document.getElementById('Menu_Client').scrollTop += 1;
    menuScrollTop = document.getElementById('Menu_Client').scrollTop;
    menuHeight = document.getElementById("Menu_Client").clientHeight;
    elementOffsetTop_bottom = getMenuElementOffsetTop(obj) + obj.clientHeight - menuScrollTop;
  }

  if (focusedMenuElement!=null && focusedMenuElement!='null' && focusedMenuElement!='') {
    removeMenuElementFocus(focusedMenuElement);
  }
  focusedMenuElement = obj;
  putMenuElementFocus(focusedMenuElement);
}

function menuUpKey(state) {
  if (navigator.userAgent.indexOf("NT") != -1 && state == true) {
    setMenuElementFocus(getPreviousMenuElement(focusedMenuElement));
  } else {
    if (state) {
      if (!isGoingUp) {
        firstGoingUp = true;
        isGoingUp = true;
        menuUpKeyDelay();
      }
    } else if (!state) {
      isGoingUp = false;
      return true;
    }
  }
  return false;
}

function menuUpKeyDelay() {
  if (isGoingUp) {
    setMenuElementFocus(getPreviousMenuElement(focusedMenuElement));
    if (firstGoingUp) {
      firstGoingUp = false;
      setTimeout('menuUpKeyDelay();', 400);
    } else {
      setTimeout('menuUpKeyDelay();', 60);
    }
  } else {
    return false;
  }
}

function menuDownKey(state) {
  if (navigator.userAgent.indexOf("NT") != -1 && state==true) {
    setMenuElementFocus(getNextMenuElement(focusedMenuElement));
  } else {
    if (state) {
      if (!isGoingDown) {
        firstGoingDown = true;
        isGoingDown = true;
        menuDownKeyDelay();
      }
    } else if (!state) {
      isGoingDown = false;
      return true;
    }
  }
  return false;
}

function menuDownKeyDelay(){
  if (isGoingDown) {
    setMenuElementFocus(getNextMenuElement(focusedMenuElement));
    if (firstGoingDown) {
      firstGoingDown = false;
      setTimeout('menuDownKeyDelay();', 400);
    } else {
      setTimeout('menuDownKeyDelay();', 60);
    }
  } else {
    return false;
  }
}

function menuLeftKey() {
  desactivateElement(focusedMenuElement);  

}

function menuRightKey() {
  activateElement(focusedMenuElement);
}

function menuHomeKey() {
  var obj = getFirstMenuElement();
  setMenuElementFocus(obj);
}

function menuEndKey() {
  var obj = getLastMenuElement();
  setMenuElementFocus(obj);
}

function menuHomeKey() {
  var obj = getFirstMenuElement();
  setMenuElementFocus(obj);
}

function menuEnterKey() {
  cambiarSituacion(null, focusedMenuElement);
  focusedMenuElement.onclick();  
}