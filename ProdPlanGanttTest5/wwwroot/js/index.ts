/// <reference path="../js/lib/DHX/codebase/dhtmlxgantt.d.ts" />

import * as Gantt from "../js/lib/DHX/codebase/dhtmlxgantt";
import * as Planner from "./Planner";
import { PlannerUI } from "./PlannerUI";

declare var gantt: Gantt.GanttStatic;
declare var $: any;
declare var ej: any;
declare var ejs: any;

interface graphPoint {
    theDate: Date;
    freq: number;
}
    try {
        (<any>document.getElementById('logodp')).ej2_instances[0].addEventListener("select", (args: any) => { logout(args); });
        (<any>document.getElementById('gbdropdown')).ej2_instances[0].addEventListener("change", (args: any) => { grpFilter(args); });
        (<any>document.getElementById('filter_status')).ej2_instances[0].addEventListener("change", (args: any) => { filterStatus(); });
        (<any>document.getElementById('filter_statusR')).ej2_instances[0].addEventListener("change", (args: any) => { filterStatus(); });
        (<any>document.getElementById('filter_none')).ej2_instances[0].addEventListener("change", (args: any) => { filterNone(); });
        (<any>document.getElementById('filter_tasks')).ej2_instances[0].addEventListener("change", (args: any) => { filterTask(); });
        (<any>document.getElementById('filter_resources')).ej2_instances[0].addEventListener("change", (args: any) => { filterResources(); });
        (<any>document.getElementById('BPdropdown')).ej2_instances[0].addEventListener("change", (args: any) => { bpFilter(args); });
        (<any>document.getElementById('Itmdropdown')).ej2_instances[0].addEventListener("change", (args: any) => { itmFilter(args); });
        (<any>document.getElementById('PNdropdown')).ej2_instances[0].addEventListener("change", (args: any) => { pnFilter(args); });
        (<any>document.getElementById('SOdropdown')).ej2_instances[0].addEventListener("change", (args: any) => { soFilter(args); });
        (<any>document.getElementById('POdropdown')).ej2_instances[0].addEventListener("change", (args: any) => { poFilter(args); });
        (<any>document.getElementById('rangeNavigator')).ej2_instances[0].addEventListener("changed", (args: any) => { datechange(args); });
        //(<any>document.getElementById('rangeNavigator2')).ej2_instances[0].addEventListener("changed", (args: any) => { datechange2(args); });
/*        (<any>document.getElementById('confirm_dialog')).addEventListener("created", (args: any) => { onLoadconfirm(); });
        (<any>document.getElementById('confirm_dialog')).addEventListener("open", (args: any) => { dialogOpen(); });
        (<any>document.getElementById('confirm_dialog')).addEventListener("close", (args: any) => { dialogClose(); });*/
        //$('.a-submitLogin').closest('button').click((args: any) => { PlannerUI.OnSignInClick(); onLoadconfirm(); });
        (<any>document.getElementById("loginBt")).addEventListener("click", (args: any) => { PlannerUI.OnSignInClick(); });
/*        $('.a-closebutton').closest('button')[0].ej2_instances[0].addEventListener("click", (args: any) => { filterResources(); });*/
        $('#datebtn').click((args: any) => { datepicker(); });
        //for filter button setup at the start
        $('#filter_none').click((args: any) => { filterNone(); });
        $('#filter_tasks').click((args: any) => { filterTask(); });
        $('#filter_resources').click((args: any) => { filterResources(); });
    } catch (e) {
        console.log(e);
    }



var arrayTestList: any[] = [];
var startdate: any;
var enddate: any;
$("#Username").parent().css("border-radius", "30px");
$("#Password").parent().css("border-radius", "30px");

let form = PlannerUI.ReadCriteriaForm();

//var rangenav = (<any>document.getElementById('rangeNavigator')).ej2_instances[0];

var startMax = new Date($('.startdate').text());
var endMax = new Date($('.enddate').text());
var dplusMonth = parseInt($('#dplusMonth').text());
if (dplusMonth < 1) {
    dplusMonth = 1;
}
//change before pushing--------------------------
//if (dplusMonth != 0) {
var today = new Date();
startMax = new Date(today.setMonth(today.getMonth() - dplusMonth));
today = new Date();
endMax = new Date(today.setMonth(today.getMonth() + dplusMonth));
//}



datechange({ start: startMax, end: endMax });
(<any>document.getElementById('rangeNavigator')).ej2_instances[0].value = [endMax, startMax];


Planner.PlannerState.Initialise();
/*ej.base.getComponent(document.querySelector("#filter_tasks"), 'switch').checked = true;
ej.base.getComponent(document.querySelector("#filter_tasks"), 'switch').checked = false;*/

function logout(args: any) {
    if (args.item.text == 'Log-out') {
        $('#logoutbtn').click();
        location.reload();
    }
}
ej.base.registerLicense('ORg4AjUWIQA/Gnt2VVhiQlFac19JXGFWfVJpTGpQdk5xdV9DaVZUTWY/P1ZhSXxRd0ViXn9YcnJUQ2ddU0U=');
var circularProgress = new ej.progressbar.ProgressBar({
    type: 'Circular',
    height: '200px',
    width: '200px',
    trackThickness: 15,
    progressThickness: 15,
    startAngle: 220,
    endAngle: 140,
    segmentCount: 50,
    gapWidth: 5,
    value: 1,
    animation: {
        enable: true,
        duration: 500
    },
    annotations: [{
        content: '<div id="point1" style="font-size:24px;font-weight:bold;color:#0078D6"><span></span></div>'
    }],
    cornerRadius: 'Square',
    load: function (args: any) {
        var linearSegment = location.hash.split('/')[1];
        linearSegment = linearSegment ? linearSegment : 'bootstrap5-dark';
        args.progressBar.theme = (linearSegment.charAt(0).toUpperCase() +
            linearSegment.slice(1)).replace(/-dark/i, 'Dark').replace(/contrast/i, 'Contrast');
        switch (linearSegment) {
            case 'bootstrap5':
            case 'bootstrap5-dark':
                args.progressBar.annotations[0].content = '<div id="point1" style="font-size:24px;font-weight:bold;color:#0D6EFD"><span></span></div>';
                break;

        }
    }
});
circularProgress.appendTo('#circularSegment');

var circularProgress3 = new ej.progressbar.ProgressBar({
    type: 'Circular',
    height: '200px',
    width: '200px',
    isIndeterminate: true,
    trackThickness: 15,
    progressThickness: 15,
    startAngle: 240,
    endAngle: 240,
    segmentCount: 50,
    gapWidth: 5,
    value: 80,
    animation: {
        enable: true,
        duration: 1000
    },
    annotations: [{
        content: '<div id="point1" style="font-size:24px;font-weight:bold;color:#0078D6"><span></span></div>'
    }],
    cornerRadius: 'Square',
    load: function (args: any) {
        var linearSegment = location.hash.split('/')[1];
        linearSegment = linearSegment ? linearSegment : 'bootstrap5-dark';
        args.progressBar.theme = (linearSegment.charAt(0).toUpperCase() +
            linearSegment.slice(1)).replace(/-dark/i, 'Dark').replace(/contrast/i, 'Contrast');
        switch (linearSegment) {
            case 'bootstrap5':
            case 'bootstrap5-dark':
                args.progressBar.annotations[0].content = '<div id="point1" style="font-size:24px;font-weight:bold;color:#0D6EFD"><span></span></div>';
                break;

        }
    }
});
circularProgress3.appendTo('#circularSegment2');
//--------------------------------------------------------------------------------------
var datastr = $('#sourcestr').text();
var jsonSourcestr = JSON.parse(datastr);
var datastr2 = $('#sourcestr2').text();
var jsonSourcestr2 = JSON.parse(datastr2);
jsonSourcestr.map((data: any) => {

    data['theDate'] = new Date(data['theDate']);
    data['freq'] = Number.parseFloat(data['freq']);
});
jsonSourcestr2.map((data: any) => {

    data['theDate'] = new Date(data['theDate']);
    data['freq'] = Number.parseFloat(data['freq']);
});
var result = jsonSourcestr.map((data: { theDate: Date; freq: number; }) => ({ value: data.theDate, text: data.freq }));


//single range selector so we change the datasource and touch nothing else inside like date because it will auto adjust
 function rangeToggle(toggle: string) {
    let ranger1 = (<any>document.getElementById('rangeNavigator')).ej2_instances[0];
    //ranger1.value = [new Date('04/12/2022'), new Date('18/04/2022') ]
    if (toggle == 'planned') { ranger1.series[0].dataSource = jsonSourcestr2; }
    else { ranger1.series[0].dataSource = jsonSourcestr; }
    


}
//-----------------------------------------------------------------------------------------------------------------------------------

var CircularSegmentLoader = new ej.progressbar.ProgressBar({
    type: 'Circular',
    height: '80',
    segmentCount: 0,
    value: 0,
    animation: {
        enable: true,
        duration: 0,
        delay: 0,
    },
});
CircularSegmentLoader.appendTo('#newLoader');

document.getElementById('bt-edit').onclick = function () {
    $.RangeNavigator.dataSource = jsonSourcestr2;
    //RangeNavigator.refresh();
};


var SaveLoaderbtn = new ej.buttons.Button({ isPrimary: true });
SaveLoaderbtn.appendTo('#SaveLoaderbtn');
SaveLoaderbtn.element.onclick = function () {
    var howMany = 0;
    var howManyDone = 0;
    howMany = parseInt($('#save-todo-count').text());
    howManyDone = parseInt($('#save-num-saved').text());
    var finalnum = 100 / howMany;
    CircularSegmentLoader.segmentCount = howMany;
    CircularSegmentLoader.value = howManyDone * finalnum;

};

export function SaveLoader() {
    var howMany = 0;
    var howManyDone = 0;
    howMany = parseInt($('#save-todo-count').text());
    howManyDone = parseInt($('#save-num-saved').text());
    var finalnum = 100 / howMany;
    CircularSegmentLoader.segmentCount = howMany;
    CircularSegmentLoader.value = howManyDone * finalnum;

};


document.getElementById('ResetFiltersbtn').onclick = function () {
    resetFilters();
};



function QueryParser(dstart: any, dend: any) {
    var status = ej.base.getComponent(document.querySelector("#filter_status"), 'switch');
    var BPd = (<any>document.getElementById('BPdropdown')).ej2_instances[0];
    var PNd = (<any>document.getElementById('PNdropdown')).ej2_instances[0];
    var SOd = (<any>document.getElementById('SOdropdown')).ej2_instances[0];
    var POd = (<any>document.getElementById('POdropdown')).ej2_instances[0];
    var Itmd = (<any>document.getElementById('Itmdropdown')).ej2_instances[0];
    var bp = BPd.value;
    var pn = PNd.value;
    var so = SOd.value;
    var po = POd.value;
    var itm = Itmd.value;

    var mainJsonStr = "[{\"name\":\"bpstart\",\"value\":\"\"},{\"name\":\"bpend\",\"value\":\"\"},{\"name\":\"itmstart\",\"value\":\"\"},{\"name\":\"projectstart\",\"value\":\"\"},{\"name\":\"projectend\",\"value\":\"\"},{\"name\":\"sostart\",\"value\":\"\"},{\"name\":\"soend\",\"value\":\"\"},{\"name\":\"postart\",\"value\":\"\"},{\"name\":\"poend\",\"value\":\"\"},{\"name\":\"postatus\",\"value\":\"R\"},{\"name\":\"datetype\",\"value\":\"PO\"},{\"name\":\"datestart\",\"value\":\"\"},{\"name\":\"dateend\",\"value\":\"\"},{\"name\":\"workwindow\",\"value\":\"28\"}]";
    var jj1 = JSON.parse(mainJsonStr);

    jj1.map(function (obj:any) {
        (obj.name === "datestart") && (obj.value = dstart);
    });
    jj1.map(function (obj:any) {
        (obj.name === "dateend") && (obj.value = dend);
    });
    /////////
    
    if (bp.length > 0) {
        var finalbps = "'" + BPd.value.join("','") + "'";
        if (finalbps != '') {
            jj1.map(function (obj: any) {
                (obj.name === "bpstart") && (obj.value = finalbps);
            });
        }
    }

    /////////
    
    if (itm.length > 0) {
        var finalitms = "'" + Itmd.value.join("','") + "'";
        if (finalitms != '') {
            jj1.map(function (obj: any) {
                (obj.name === "itmstart") && (obj.value = finalitms);
            });
        }
    }

    /////////
    
    if (pn != null) {
        var finalpns = "'" + PNd.value.join("','") + "'";
        if (finalpns != '') {
            jj1.map(function (obj: any) {
                (obj.name === "projectstart") && (obj.value = finalpns);
            });
        }
    }

    /////////
    
    if (so != null) {
        var finalsos = "'" + SOd.value.join("','") + "'";
        if (finalsos != '') {
            jj1.map(function (obj: any) {
                (obj.name === "sostart") && (obj.value = finalsos);
            });
        }
    }

    /////////
    
    if (po != null) {
        var finalpos = "'" + POd.value.join("','") + "'";
        jj1.map(function (obj: any) {
            (obj.name === "postart") && (obj.value = finalpos);
        });
    }


    if (status.checked == true) {
        jj1.map(function (obj:any) {
            (obj.name === "postatus") && (obj.value = "PR");
        });
    }
    else if (status.checked == false) {
        jj1.map(function (obj:any) {
            (obj.name === "postatus") && (obj.value = "R");
        });
    }

    var jj2 = JSON.stringify(jj1);
    $('.finalquery').text(jj2);
}

let distinctfilter = (array: any[], key: any) => {
    return [...new Map(array.map(item => [item[key], item])).values()];
};

class DropdownSORecord {
    public constructor(SO: any) {
        this.SODocNum = SO.SODocNum;
        this.SODate = SO.SODate;
    }

    public SODocNum: number;
    public SODate: Date | string;

    public get Label(): string {
        if (this.SODocNum == 0) {
            return "No Order";
        }
        else {
            return `${this.SODocNum} ${this.SODate}`;
        }
    }
}


///////////////////////////////////////////////////////////////////////////////
async function resetFilters() {
//------------------------------------------------------------------------------
    let onscreentasks = <Planner.PlanningTask[]>gantt.getTaskByTime();

    let baselinetasks = Planner.PlannerState.baseline;


    var alltasks = [].concat(onscreentasks); alltasks = alltasks.concat(baselinetasks);

    alltasks = alltasks.filter(t => !(t instanceof Planner.groupmarker));

    var initial_criteria = [
        { "name": "datestart", "value": startdate },
        { "name": "dateend", "value": enddate },
        { "name": "bpstart", "value": "" },
        { "name": "bpend", "value": "" },
        { "name": "itmstart", "value": "" },
        { "name": "projectstart", "value": "" },
        { "name": "projectend", "value": "" },
        { "name": "sostart", "value": "" },
        { "name": "soend", "value": "" },
        { "name": "postart", "value": "" },
        { "name": "poend", "value": "" },
        { "name": "postatus", "value": "R" },
        { "name": "datetype", "value": "PO" },
        { "name": "workwindow", "value": "28" }
    ];
    $('.finalquery').text(JSON.stringify(initial_criteria));

    var BPd = (<any>document.getElementById('BPdropdown')).ej2_instances[0];
    var PNd = (<any>document.getElementById('PNdropdown')).ej2_instances[0];
    var SOd = (<any>document.getElementById('SOdropdown')).ej2_instances[0];
    var POd = (<any>document.getElementById('POdropdown')).ej2_instances[0];
    var Itmd = (<any>document.getElementById('Itmdropdown')).ej2_instances[0];

    arrayTestList = alltasks;//items;---old

//------------------------------------------------------------
    var startdate = new Date($('.startdate').text()).toISOString().slice(0, 10);
    var enddate = new Date($('.enddate').text()).toISOString().slice(0, 10);
    var mainfilterJsonObj1 = fetch("/api/data/getFilteredData2", {
        method: "POST",
        body: JSON.stringify({ startd: startdate, endd: enddate }),
        headers: [["Content-Type", "application/json"]]
    });
    var rawJsonResp2 = await mainfilterJsonObj1;

    var business_partners = distinctfilter(await rawJsonResp2.json(), "BPCode");
    BPd.fields = { text: 'BPDesc', value: 'BPCode' };
    BPd.itemTemplate = "${BPCode} -> ${BPDesc}";
    BPd.dataSource = business_partners;

    var Sales_orders = distinctfilter(alltasks.map(x => new DropdownSORecord(x)), "SODocNum");
    SOd.fields = { text: 'SODocNum', value: 'SODocNum' };
    SOd.itemTemplate = "${Label}";
    SOd.dataSource = Sales_orders;

    var PN_orders = distinctfilter(alltasks, "Project");
    PNd.fields = { text: 'PNDescription', value: 'Project' };
    PNd.itemTemplate = "${Project} -> ${PNDescription}";
    PNd.dataSource = PN_orders;

    var PO_orders = distinctfilter(alltasks, "PODocNum");
    POd.fields = { text: 'PODescription', value: 'PODocNum' };
    POd.itemTemplate = "${PODocNum} -> ${PODescription}";
    POd.dataSource = PO_orders;

    var Item_orders = distinctfilter(alltasks, "POItemCode");
    Itmd.fields = { text: 'ItemDescription', value: 'POItemCode' };
    Itmd.itemTemplate = "${POItemCode} -> ${ItemDescription}";
    Itmd.dataSource = Item_orders;
//--------------------------------------------------------------
    
}
function StrChopper(str: string) {
    //var s = '/Controller/Action?id=11112&value=4444';
    str = str.substring(0, str.indexOf(' ->'));
    return str;
}
function StrChopper2(str: string) {
    //var s = '/Controller/Action?id=11112&value=4444';
    str = str.substring(0, str.indexOf('T'));
    return str;
}


function bpFilter(args: any) {
    if (args.value == null) {
        $('#ResetFiltersbtn').click();
    }
    else {
        var query = $('.finalquery').text();
        var formarr = JSON.parse(query);
        ////////////////////////////////
        var BPd = (<any>document.getElementById('BPdropdown')).ej2_instances[0];
        var PNd = (<any>document.getElementById('PNdropdown')).ej2_instances[0];
        var SOd = (<any>document.getElementById('SOdropdown')).ej2_instances[0];
        var POd = (<any>document.getElementById('POdropdown')).ej2_instances[0];
        var Itmd = (<any>document.getElementById('Itmdropdown')).ej2_instances[0];

        formarr.filter((f: any) => f.name === "bpstart")[0].value = "'" + BPd.value.join("','") + "'";
        var r = (args.value);

        var jj2 = JSON.stringify(formarr);
        $('.finalquery').text(jj2);
        ////////////////////////////

        var alltasks = arrayTestList.filter((f) => r.includes(f.POCardCode));
        var Sales_orders = distinctfilter(alltasks.map(x => new DropdownSORecord(x)), "SODocNum");
        SOd.fields = { text: 'SODocNum', value: 'SODocNum' };
        SOd.itemTemplate = "${Label}";
        SOd.dataSource = Sales_orders;

        var PN_orders = distinctfilter(alltasks, "Project");
        PNd.fields = { text: 'PNDescription', value: 'Project' };
        PNd.itemTemplate = "${Project} -> ${PNDescription}";
        PNd.dataSource = PN_orders;

        var PO_orders = distinctfilter(alltasks, "PODocNum");
        POd.fields = { text: 'PODescription', value: 'PODocNum' };
        POd.itemTemplate = "${PODocNum} -> ${PODescription}";
        POd.dataSource = PO_orders;

        var Item_orders = distinctfilter(alltasks, "POItemCode");
        Itmd.fields = { text: 'ItemDescription', value: 'POItemCode' };
        Itmd.itemTemplate = "${POItemCode} -> ${ItemDescription}";
        Itmd.dataSource = Item_orders;
        if (r.length == 0) {
            resetFilters();
        }

    }

}
function itmFilter(args: any) {
    if (args.value == null) {
        $('#ResetFiltersbtn').click();
    }
    else {
        var query = $('.finalquery').text();
        var formarr = JSON.parse(query);
        ////////////////////////////////
        var BPd = (<any>document.getElementById('BPdropdown')).ej2_instances[0];
        var PNd = (<any>document.getElementById('PNdropdown')).ej2_instances[0];
        var SOd = (<any>document.getElementById('SOdropdown')).ej2_instances[0];
        var POd = (<any>document.getElementById('POdropdown')).ej2_instances[0];
        var Itmd = (<any>document.getElementById('Itmdropdown')).ej2_instances[0];

        formarr.filter((f: any) => f.name === "itmstart")[0].value = "'" + Itmd.value.join("','") + "'";
        var r = (args.value);

        var jj2 = JSON.stringify(formarr);
        $('.finalquery').text(jj2);
        ////////////////////////////
        var alltasks = arrayTestList.filter((f) => r.includes(f.POItemCode));

        var Sales_orders = distinctfilter(alltasks.map(x => new DropdownSORecord(x)), "SODocNum");
        SOd.fields = { text: 'SODocNum', value: 'SODocNum' };
        SOd.itemTemplate = "${Label}";
        SOd.dataSource = Sales_orders;

        var PN_orders = distinctfilter(alltasks, "Project");
        PNd.fields = { text: 'PNDescription', value: 'Project' };
        PNd.itemTemplate = "${Project} -> ${PNDescription}";
        PNd.dataSource = PN_orders;

        var PO_orders = distinctfilter(alltasks, "PODocNum");
        POd.fields = { text: 'PODescription', value: 'PODocNum' };
        POd.itemTemplate = "${PODocNum} -> ${PODescription}";
        POd.dataSource = PO_orders;

        var Item_orders = distinctfilter(alltasks, "POItemCode");
        Itmd.fields = { text: 'ItemDescription', value: 'POItemCode' };
        Itmd.itemTemplate = "${POItemCode} -> ${ItemDescription}";
        Itmd.dataSource = Item_orders;
        //Itmd.placeholder = "Select Item";
        if (r.length == 0) {
            resetFilters();
        }
    }

}
function pnFilter(args: any) {
    if (args.value == null) {
        $('#ResetFiltersbtn').click();
    }
    else {
        var query = $('.finalquery').text();
        var formarr = JSON.parse(query);
        var BPd = (<any>document.getElementById('BPdropdown')).ej2_instances[0];
        var PNd = (<any>document.getElementById('PNdropdown')).ej2_instances[0];
        var SOd = (<any>document.getElementById('SOdropdown')).ej2_instances[0];
        var POd = (<any>document.getElementById('POdropdown')).ej2_instances[0];
        var Itmd = (<any>document.getElementById('Itmdropdown')).ej2_instances[0];

        formarr.filter((f: any) => f.name === "projectstart")[0].value = "'" + PNd.value.join("','") + "'";
        var r = args.value;

        var jj2 = JSON.stringify(formarr);
        $('.finalquery').text(jj2);
        ///////////////////////////
        var alltasks = arrayTestList.filter((f) => r.includes(f.Project));

        var Sales_orders = distinctfilter(alltasks.map(x => new DropdownSORecord(x)), "SODocNum");
        SOd.fields = { text: 'SODocNum', value: 'SODocNum' };
        SOd.itemTemplate = "${Label}";
        SOd.dataSource = Sales_orders;

        var PN_orders = distinctfilter(alltasks, "Project");
        PNd.fields = { text: 'PNDescription', value: 'Project' };
        PNd.itemTemplate = "${Project} -> ${PNDescription}";
        PNd.dataSource = PN_orders;

        var PO_orders = distinctfilter(alltasks, "PODocNum");
        POd.fields = { text: 'PODescription', value: 'PODocNum' };
        POd.itemTemplate = "${PODocNum} -> ${PODescription}";
        POd.dataSource = PO_orders;

        var Item_orders = distinctfilter(alltasks, "POItemCode");
        Itmd.fields = { text: 'ItemDescription', value: 'POItemCode' };
        Itmd.itemTemplate = "${POItemCode} -> ${ItemDescription}";
        Itmd.dataSource = Item_orders;
        if (r.length == 0) {
            resetFilters();
        }
    }

}
function soFilter(args: any) {
    if (args.value == null) {
        $('#ResetFiltersbtn').click();
    }
    else {
        var query = $('.finalquery').text();
        var formarr = JSON.parse(query);
        var BPd = (<any>document.getElementById('BPdropdown')).ej2_instances[0];
        var PNd = (<any>document.getElementById('PNdropdown')).ej2_instances[0];
        var SOd = (<any>document.getElementById('SOdropdown')).ej2_instances[0];
        var POd = (<any>document.getElementById('POdropdown')).ej2_instances[0];
        var Itmd = (<any>document.getElementById('Itmdropdown')).ej2_instances[0];

        formarr.filter((f: any) => f.name === "sostart")[0].value = "'" + SOd.value.join("','") + "'";
        var r = args.value;

        var jj2 = JSON.stringify(formarr);
        $('.finalquery').text(jj2);
        ///////////////////////////
        var alltasks = arrayTestList.filter((f) => r.includes(f.SODocNum));

        var Sales_orders = distinctfilter(alltasks.map(x => new DropdownSORecord(x)), "SODocNum");
        SOd.fields = { text: 'SODocNum', value: 'SODocNum' };
        SOd.itemTemplate = "${Label}";
        SOd.dataSource = Sales_orders;

        var PN_orders = distinctfilter(alltasks, "Project");
        PNd.fields = { text: 'PNDescription', value: 'Project' };
        PNd.itemTemplate = "${Project} -> ${PNDescription}";
        PNd.dataSource = PN_orders;

        var PO_orders = distinctfilter(alltasks, "PODocNum");
        POd.fields = { text: 'PODescription', value: 'PODocNum' };
        POd.itemTemplate = "${PODocNum} -> ${PODescription}";
        POd.dataSource = PO_orders;

        var Item_orders = distinctfilter(alltasks, "POItemCode");
        Itmd.fields = { text: 'ItemDescription', value: 'POItemCode' };
        Itmd.itemTemplate = "${POItemCode} -> ${ItemDescription}";
        Itmd.dataSource = Item_orders;
        //SOd.placeholder = "Select Sales-order";
        SOd.value = r;
        if (r.length == 0) {
            resetFilters();
        }
    }

}
function poFilter(args : any) {
    if (args.value == null) {
        $('#ResetFiltersbtn').click();
    }
    else {
        var query = $('.finalquery').text();
        var formarr = JSON.parse(query);
        var BPd = (<any>document.getElementById('BPdropdown')).ej2_instances[0];
        var PNd = (<any>document.getElementById('PNdropdown')).ej2_instances[0];
        var SOd = (<any>document.getElementById('SOdropdown')).ej2_instances[0];
        var POd = (<any>document.getElementById('POdropdown')).ej2_instances[0];
        var Itmd = (<any>document.getElementById('Itmdropdown')).ej2_instances[0];

        formarr.filter((f: any) => f.name === "postart")[0].value = "'" + POd.value.join("','") + "'";
        var r = args.value;

        var jj2 = JSON.stringify(formarr);
        $('.finalquery').text(jj2);
        ///////////////////////////
        var alltasks = arrayTestList.filter((f) => r.includes(f.PODocNum));

        var Sales_orders = distinctfilter(alltasks.map(x => new DropdownSORecord(x)), "SODocNum");
        SOd.fields = { text: 'SODocNum', value: 'SODocNum' };
        SOd.itemTemplate = "${Label}";
        SOd.dataSource = Sales_orders;

        var PN_orders = distinctfilter(alltasks, "Project");
        PNd.fields = { text: 'PNDescription', value: 'Project' };
        PNd.itemTemplate = "${Project} -> ${PNDescription}";
        PNd.dataSource = PN_orders;

        var PO_orders = distinctfilter(alltasks, "PODocNum");
        POd.fields = { text: 'PODescription', value: 'PODocNum' };
        POd.itemTemplate = "${PODocNum} -> ${PODescription}";
        POd.dataSource = PO_orders;

        var Item_orders = distinctfilter(alltasks, "POItemCode");
        Itmd.fields = { text: 'ItemDescription', value: 'POItemCode' };
        Itmd.itemTemplate = "${POItemCode} -> ${ItemDescription}";
        Itmd.dataSource = Item_orders;
        //POd.placeholder = "Select Production-order";
        //BPd.dataSource = tmpBPs;
        if (r.length == 0) {
            resetFilters();
        }
    }

}
function grpFilter(args : any) {
    $("#dpbutton").click();
}

function dateformatter(dt : Date) {
    var date = new Date(dt);
    var date2 = ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + date.getFullYear();
    //console.log((date2));
    return date2;
}
export function datechange(args : any) {
    var dE1 = new Date(args.end).setHours(0, 0, 0, 0);

    var dS1 = new Date(args.start).setHours(0, 0, 0, 0);
    var dE2 = new Date("2022-12-04T23:00:00.000Z").setHours(0, 0, 0, 0);

    var dS2 = new Date("2022-04-18T23:00:00.000Z").setHours(0, 0, 0, 0);
    var jj = $('#range01').text();
    if (jj == 'true') {
        //if (dE1 < 1659222000000) {
        (<any>document.getElementById('rangeNavigator')).ej2_instances[0].value = [
            new Date(args.end),
            new Date(args.start),
        ];
        //}
    }
    var start = args.start;
    var end = args.end;

    var stard = dateformatter(start);
    var endd = dateformatter(end);

    startdate = stard;
    enddate = endd;
    QueryParser(stard, endd);

    $('.startdate').text(start);
    $('.enddate').text(end);
    $('.dlgbtn').show();
}

///////////////////////////////////////////////////////////////// center filters--------------------------
async function filterStatus() {
    var datecpt = (<any>document.getElementById('rangeNavigator')).ej2_instances[0];
    var status = ej.base.getComponent(document.querySelector("#filter_status"), 'switch');
    var statusR = ej.base.getComponent(document.querySelector("#filter_statusR"), 'switch');
    var mainJsonStr = "[{\"name\":\"bpstart\",\"value\":\"\"},{\"name\":\"bpend\",\"value\":\"\"},{\"name\":\"itmstart\",\"value\":\"\"},{\"name\":\"projectstart\",\"value\":\"\"},{\"name\":\"projectend\",\"value\":\"\"},{\"name\":\"sostart\",\"value\":\"\"},{\"name\":\"soend\",\"value\":\"\"},{\"name\":\"postart\",\"value\":\"\"},{\"name\":\"poend\",\"value\":\"\"},{\"name\":\"postatus\",\"value\":\"R\"},{\"name\":\"datetype\",\"value\":\"PO\"},{\"name\":\"datestart\",\"value\":\"\"},{\"name\":\"dateend\",\"value\":\"\"},{\"name\":\"workwindow\",\"value\":\"28\"}]";
    var jj1 = JSON.parse(mainJsonStr);
    jj1.map(function (obj:any) {
        (obj.name === "datestart") && (obj.value = startdate);
    });
    jj1.map(function (obj: any) {
        (obj.name === "dateend") && (obj.value = enddate);
    });
    if (status.checked == true && statusR.checked == true) {
        $('#plannedbool').text("true");
        $('#releasedbool').text("true");

        jj1.map(function (obj: any) {
            (obj.name === "postatus") && (obj.value = "PR");
        });
        $('#plannedChk').text("true");
        var mainfilterJsonObj = fetch("/api/data/getSliderData2?includePlanned=true", {
            method: "POST",
            headers: [["Content-Type", "application/json"]]
        });
        var rawJsonResp = await mainfilterJsonObj;
        var rawJsonStr = await rawJsonResp.json();
        var jsonTestList1 = JSON.stringify(rawJsonStr);
        var final = JSON.parse(jsonTestList1);
        var final2 = final.map((x:any) => x.theDate);
        var final3 = [];
        var finallength = final2.length;
        for (var i = 0; i < finallength; i++) {
            var vo = final2[i];
            if (i != finallength) {
                var io = StrChopper2(vo);
                final3.push(io);
            }
        }
        const min = Date.parse(final3.reduce((acc, date) => { return acc && new Date(acc) < new Date(date) ? acc : date }, ''));
        const max = Date.parse(final3.reduce((acc, date) => { return acc && new Date(acc) > new Date(date) ? acc : date }, ''));

        rangeToggle('planned');
    }

    else if (status.checked == true && statusR.checked == false) {
        $('#plannedbool').text("true");
        $('#releasedbool').text("false");
        jj1.map(function (obj: any) {
            (obj.name === "postatus") && (obj.value = "P");
        });
        statusR.checked = false;
        status.checked = true;
        $('#plannedChk').text("true");
        rangeToggle('planned');
        //document.body.style.zoom = "1.0"; this.blur();
        //$(window).trigger('resize');
    }
    else if (status.checked == false && statusR.checked == true) {
        $('#plannedbool').text("false");
        $('#releasedbool').text("true");
        jj1.map(function (obj: any) {
            (obj.name === "postatus") && (obj.value = "R");
        });
        status.checked = false;
        statusR.checked = true;
        $('#plannedChk').text("false");
        rangeToggle('');
        //document.body.style.zoom = "1.0"; this.blur();

    }
    else {
        $('#plannedbool').text("false");
        jj1.map(function (obj: any) {
            (obj.name === "postatus") && (obj.value = "R");
        });
        status.checked = false;
        statusR.checked = true;
        $('#plannedChk').text("false");
        rangeToggle('');
    }

    var jj2 = JSON.stringify(jj1);
    $('.finalquery').text(jj2);
    $("#updater").click();

}
export function filterNone() {
    $(".dropdown").click(function (e: any) {
        e.stopPropagation();
    })
    var none = ej.base.getComponent(document.querySelector("#filter_none"), 'switch');
    var tasks = ej.base.getComponent(document.querySelector("#filter_tasks"), 'switch');
    var resources = ej.base.getComponent(document.querySelector("#filter_resources"), 'switch');
    if (none.checked == true) {
        tasks.checked = false;
        resources.checked = false;
        //$('#filter_none1').click();
        PlannerUI.OnClickFilterNone();
    }
}
export function filterTask() {
    $(".dropdown").click(function (e: any) {
        e.stopPropagation();
    })
    var none = ej.base.getComponent(document.querySelector("#filter_none"), 'switch');
    var tasks = ej.base.getComponent(document.querySelector("#filter_tasks"), 'switch');
    var resources = ej.base.getComponent(document.querySelector("#filter_resources"), 'switch');
    if (tasks.checked == true) {
        none.checked = false;
        resources.checked = false;
        //$('#filter_tasks1').click();
        PlannerUI.OnClickFilterTasks();
    }
    else if (tasks.checked == false && resources.checked == false) {
        none.checked = true;
        //$('#filter_none1').click();
        PlannerUI.OnClickFilterNone();
    }
}
export function filterResources() {
    $(".dropdown").click(function (e: any) {
        e.stopPropagation();
    })
    var none = ej.base.getComponent(document.querySelector("#filter_none"), 'switch');
    var tasks = ej.base.getComponent(document.querySelector("#filter_tasks"), 'switch');
    var resources = ej.base.getComponent(document.querySelector("#filter_resources"), 'switch');
    if (resources.checked == true) {
        none.checked = false;
        tasks.checked = false;
        //$('#filter_resources1').click();
        PlannerUI.OnClickFilterResources();
    }
    else if (tasks.checked == false && resources.checked == false) {
        none.checked = true;
        //$('#filter_none1').click();
        PlannerUI.OnClickFilterNone();
    }
}

//////////////////////////////////////////////////////////////////////////




var alertObj, confirmObj: any, promptObj;
var buttons = document.querySelectorAll('.dlgbtn');

/*function onLoadconfirm() {
    confirmObj = this;
    document.getElementById('confirmBtn').onclick = function () {
        //confirmObj.show();

    };
}

function closeBtnClick() {

    if ($('#err').length > 0) {

        confirmObj.hide();
    }

    else {

    }
}*/

function dialogClose() {
    buttons[0].classList.remove('e-btn-hide');

}
function dialogOpen() {
    buttons[0].classList.add('e-btn-hide');

}

var progressLoad = function (args: any) {
    var selectedTheme = location.hash.split('/')[1];
    selectedTheme = selectedTheme ? selectedTheme : 'Material';
    args.progressBar.theme = (selectedTheme.charAt(0).toUpperCase() +
        selectedTheme.slice(1)).replace(/-dark/i, 'Dark').replace(/contrast/i, 'Contrast');
};
    function datepicker() {
    if ($('#rangeNavigator').is(':visible')) {
        $('#rangeNavigator').hide(500);
        if ($('#filterNav').is(':hidden')) {
            $('#updateBtn').hide(500);
            $('#updateBtn1').hide(500);
            $("#anybtn").click();
        }
    }
    else {
        $('#updateBtn').show(500);
        $('#updateBtn1').show(500);
        $('#rangeNavigator').show(500);
        $("#anybtn").click();
        var chk = $('#plannedChk').text();
        if ($('#plannedChk').text() == 'true') {
            rangeToggle('planned');

        }
        else {
            rangeToggle('');
        }
    }

}