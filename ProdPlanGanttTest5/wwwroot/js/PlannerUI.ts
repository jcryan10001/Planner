/// <reference path="Planner.ts" />
import { PlannerState } from "./Planner";

import { JqueryEvent } from "./Planner";

//Javascript modules without ambient (*.d.ts) files
// @ts-ignore - moment was included by requirejs and is valid
import moment = require("moment");
// @ts-ignore - loglevel was included by requirejs and is valid
import log = require("loglevel");
declare var ejs: any;
declare var $: any;
declare var gantt: any;

export class PlannerUI {
    public static EventsSet: boolean = false;

    public static groupBy: any = 'production-order';

    public static async InitGui() {
        this.UpdateButtonState();

        if (!PlannerUI.EventsSet) {
            this.SetupEvents();
            PlannerUI.EventsSet = true;
        }

        let groupByResp = (await fetch("/api/data/preference/GroupBy"));
        PlannerUI.groupBy = await groupByResp.json() || "production-order";

        var gbdropdown = (<any>document.getElementById('gbdropdown')).ej2_instances[0];
        gbdropdown.value = PlannerUI.groupBy.split('--');

        let FilterResp = (await fetch("/api/data/preference/Filter"));
        let Filter = await FilterResp.json() || "hide-none";

        $('#query-modal').modal('hide');
        /*var datestart = $('#query-modal input[name=datestart]');
        datestart.datepicker('update', gantt.config.start_date);
        var dateend = $('#query-modal input[name=dateend]');
        dateend.datepicker('update', gantt.config.end_date);*/

        //PlannerState.GroupBy(groupBy);

        var selectedgrplabel = $(`.group-bylink[data-type='${PlannerUI.groupBy}']`).data('label');
        $('.group-bylabel').text(selectedgrplabel);

        if (Filter == 'hide-none') {
            ejs.base.getComponent(document.querySelector("#filter_none"), 'switch').checked = true;
            $('#filter_none').click();
        }
        if (Filter == 'hide-task') {
            ejs.base.getComponent(document.querySelector("#filter_tasks"), 'switch').checked = true;
            $('#filter_tasks').click();
        }
        if (Filter == 'hide-resource') {
            ejs.base.getComponent(document.querySelector("#filter_resources"), 'switch').checked = true;
            $('#filter_resources').click();
        }
        $(document).ready(function () {

            PlannerState.LoadGantt(false);

        })

        $(window).resize(function () {
            PlannerState.LoadGantt(true);
        });

        //Readonly mode does not feature a visible save button
        $('.bt-save').prop('hidden', PlannerState.readonlymode);

        //Hidden when on /edit or not usercanedit
        $('.bt-edit').prop('hidden', window.location.pathname == '/edit' || !PlannerState.usercanedit);
    }

    public static SetupEvents() {
        $('#dpbutton').click(PlannerUI.OnGroupByClick);
        $('#bt-query').click(PlannerUI.OnQueryClick);
        $('#updater').click(PlannerUI.OnUpdateQueryClick);
        $('#bt-save').click(PlannerUI.OnSaveClick);
        $('#bt-edit').click(PlannerUI.OnEditClick);
        $('#btn-save-ignoreall').click(PlannerUI.OnSaveIgnoreAllClick);
        $('#btn-save-retry').click(PlannerUI.OnSaveRetryClick);
        $('#filter_none').change(PlannerUI.OnClickFilterNone);
        //$('#filter_none1').click(PlannerUI.OnClickFilterNone);
        $('#filter_tasks').change(PlannerUI.OnClickFilterTasks);
        //$('#filter_tasks1').click(PlannerUI.OnClickFilterTasks);
        $('#filter_resources').change(PlannerUI.OnClickFilterResources);
        $('#filter_resources1').click(PlannerUI.OnClickFilterResources);
        $('#SaveCloseBtn').click(PlannerUI.OnGroupByClick);
        //$('#resetFilters').hide();
        //login
        //$('#confirmBtn').click(PlannerUI.OnSignInClick);
       // var user = document.getElementById('Username').va
        //datepicker
        //$('#datebtn').click(PlannerUI.datepicker);
        $('#logoutbtn').click(PlannerUI.OnLogoutClick)
    }

    public static UpdateButtonState() {
        $('.bt-save').prop('disabled', PlannerState.Dirty == 'no');
        
    }

    public static async InvokeGroupBy(tasks: any[] = null) {
        await PlannerState.GroupBy(PlannerUI.groupBy, tasks);
    }

    public static OnGroupByClick(evt: JqueryEvent) {
        $('#confirm_dialog3').show();
        var $b = $(evt.target);
        //$("#anybtn").click();

        var gbdropdown = (<any>document.getElementById('gbdropdown')).ej2_instances[0];
        PlannerUI.groupBy = gbdropdown.value.join("--");

        fetch("/api/data/preference/GroupBy", {
            method: "POST",
            body: JSON.stringify(PlannerUI.groupBy),
            headers: [["Content-Type", "application/json"]]
        });

        //Rab: Let the Idle occur so that the loading dialog appears
        window.setTimeout(() => {
            PlannerUI.InvokeGroupBy();
        }, 1);
    }

    public static OnQueryClick(evt: JqueryEvent) {

        if (document.getElementById('filterNav').style.display == 'none') {
            $('#filterNav').show(500);
            $('#resetbtnNav').show(500);
            $('#updateBtn').show(500);
            $('#updateBtn1').show(500);
        }
        else {
            $('#filterNav').hide(500);
            $('#resetbtnNav').hide(500);
            if ($('#rangeNavigator').is(':hidden')) {
                $('#updateBtn').hide(500);
                $('#updateBtn1').hide(500);
            }
        }

        //an alert if manual changes were made - but not if auto-layout occurred
/*        if (PlannerState.Dirty == 'yes') {
            evt.preventDefault();
            //ToDo: Add a screen to offer discard changes
            alert("You have made changes to the layout, these must be saved first.");
        } else {
            $('#query-modal').modal('show');
        }*/
    }
    public static ReadCriteriaForm(): { [key: string]: any } {
        var formarr = $('#query-update-form').serializeArray();
        var form: { [key: string]: any } = {};
        for (var kv of formarr) {
            form[kv.name] = kv.value;
        }
        return form;
    }
    public static async OnUpdateQueryClick(evt: JqueryEvent) {
        $('#confirm_dialog3').show();
/*        let dbName: Promise<Response>;
            dbName = fetch("/api/data/getDBName", {
            method: "POST",
            headers: [["Content-Type", "application/json"]]
        });
        let dataresponse: Response = await dbName;
        var dbstr = dataresponse.json.toString();*/
        var status = $('#plannedbool').text();
        var statusR = $('#releasedbool').text();
        var query = $('.finalquery').text();
        var formarr = JSON.parse(query);
        if (status == "true" && statusR == "true") {
            formarr.map(function (obj: { name: string; value: string; }) {
                (obj.name === "postatus") && (obj.value = "PR");
            });
        }
        else if (status == "true" && statusR == "false") {
            formarr.map(function (obj: { name: string; value: string; }) {
                (obj.name === "postatus") && (obj.value = "P");
            });
        }
        else if (status == "false" && statusR == "true") {
            formarr.map(function (obj: { name: string; value: string; }) {
                (obj.name === "postatus") && (obj.value = "R");
            });
        }
        else {
            formarr.map(function (obj: { name: string; value: string; }) {
                (obj.name === "postatus") && (obj.value = "R");
            });}
        //var jj = JSON.stringify(formarr);
        var form: { [key: string]: any } = {};
        for (var kv of formarr) {
            form[kv.name] = kv.value;
        }

        //todo: validate the form
        var validate = $.Deferred().resolve({ status: "OK" }).promise();

        let v: any = await validate;
        if (v.status == "OK") {

            $('#query-modal').hide();
            PlannerUI.startLoadingModal(2);
            //$('#confirm_dialog2').show(500);
            PlannerUI.incrementLoadingIndicator(2);


            if (form["datestart"] != null) {
                gantt.config.start_date = moment.utc(form["datestart"], "DD/MM/YYYY").toDate();
            }

            if (form["dateend"] != null) {
                gantt.config.end_date = moment.utc(form["dateend"], "DD/MM/YYYY").toDate();
            }

            gantt.render();
            await PlannerState.LoadFlatTasks(form);
            PlannerUI.incrementLoadingIndicator(4);

        } else {
            //todo: handle pretty error validation
            alert('There was a problem with your form data, check your input.');
        }
    }

    public static OnSaveClick(evt: JqueryEvent) {
        PlannerState.SaveTasksToServer();
        $('#bt-save').show();
        //$("#dpbutton").click();
    }
    public static OnHistogramCellClick(evt: JqueryEvent) {
        PlannerState.histogramClicked();

    }

    public static OnEditClick(evt: JqueryEvent) {

        //If we can change Url via History API, we should do that, then we can reload using the current credentials
        if (history.pushState !== undefined) {
            history.pushState(null, null, "/edit");
            PlannerUI.OnUpdateQueryClick(evt);
            $('#bt-save').show();
        } else {
            window.location.href = "/edit";
        }

    }

    public static OnSaveIgnoreAllClick(evt: JqueryEvent) {
        //When IgnoreAll is clicked, anything that is not saved should be ignored and the screen should be reloaded
        $('#save-issues-modal').modal('hide');
        PlannerUI.OnUpdateQueryClick(evt);
    } 

    public static OnSaveRetryClick(evt: JqueryEvent) {
        //Collect the retry buttons
        var retry_buttons = $('#save-issues-table tr:not(.template) .i-retry:checked');

        //for each button grab the DocEntry and remove the error pending a new save event
        var DocEntries: number[] = [];
        for (var item of retry_buttons) {
            var $item = $(item);
            var tr = $item.closest('tr');
            DocEntries.push(Number(tr.data('prodocentry')));
            tr.remove();
        }

        var numissues = $('#save-issues-table tbody tr:not(.template)').length;
        if (numissues == 0) {
            $('#save-message-issues').hide();
            $('#save-issues-table').hide();
        }

        PlannerState.SaveTasksToServerFromProdOrdersToSave(DocEntries, numissues);
    }

    private static loadingIndicatorValue: number = 0;
    private static loadingIndicatorMax: number = 1;
    public static startLoadingModal(max: number) {
        PlannerUI.loadingIndicatorMax = max || 1;
        PlannerUI.loadingIndicatorValue = 0;
    }

    public static hideLoadingModal() {
        $('#confirm_dialog2').hide();
     
    }

    public static incrementLoadingIndicator(increment: number) {

        if (increment == 1) {  (<any>document.getElementById('circularSegment')).ej2_instances[0].value = 25;}
        else if (increment == 2) { (<any>document.getElementById('circularSegment')).ej2_instances[0].value = 50; }
        else if (increment == 3) { (<any>document.getElementById('circularSegment')).ej2_instances[0].value = 75;}
        else if (increment == 4) { (<any>document.getElementById('circularSegment')).ej2_instances[0].value = 100;}
        else if (increment == 5) {
            //$("#loadedbtn").click();
        }    
    }

    public static OnClickFilterNone() {
        fetch("/api/data/preference/Filter", {
            method: "POST",
            body: JSON.stringify("hide-none"),
            headers: [["Content-Type", "application/json"]]
        });

        PlannerState.selectionmode = 'hide-none';
        gantt.refreshData();
    }

    public static OnClickFilterTasks() {
        fetch("/api/data/preference/Filter", {
            method: "POST",
            body: JSON.stringify("hide-task"),
            headers: [["Content-Type", "application/json"]]
        });

        PlannerState.selectionmode = 'hide-task';
        gantt.refreshData();
    }

    public static OnClickFilterResources() {
        fetch("/api/data/preference/Filter", {
            method: "POST",
            body: JSON.stringify("hide-resource"),
            headers: [["Content-Type", "application/json"]]
        });

        PlannerState.selectionmode = 'hide-resource';
        gantt.refreshData();
    }
/*    lets do the Element get by from here so directly call the function so as not to destroy marks work
*/    private static signinCallback: () => void = null;
    public static LoginDialog(callback: () => void): void {
        if (!PlannerUI.EventsSet) {
            this.SetupEvents();
            PlannerUI.EventsSet = true;
           
           
        }

        $('#error-row').hide();
      //  $('#col-lg-12 control-section').modal({ backdrop: 'static', keyboard: false });
        PlannerUI.signinCallback = callback;
    }

/*    public static confirmBtnClick() {
        // confirmObj.hide();
        $("#confirmBtn").click();
        $('#alert-danger').text('The username and/or password do not match the credentials that we have on file. Please try again or contact and administrator.');
    }*/
 

    public static async OnSignInClick(): Promise<any> {
        let username = $('#Username').val().trim();
        let password = $('#Password').val().trim();
        var error = document.getElementById('err');
        var time = new Date().toLocaleTimeString();

        if (username == '' || password == '') {
            error.style.display = "block";
                error.innerHTML = "Neither username nor password can be blank.";
            return;
        }

        var signinPayload = {
            Username: username,
            Password: password
        };

        let response = await fetch("/api/account/login", {
            method: "POST",
            body: JSON.stringify(signinPayload),
            headers: [["Content-Type", "application/json"]]
        });
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        if (response.ok) {
            let isLoggedIn = await response.json();
            if (isLoggedIn) {
                error.style.color = '#28a745';
                error.innerHTML = "Success!";
                document.getElementById('mBody').style.display = "block";
                document.getElementById("loginbox").style.display = "none";
                //$('#confirm_dialogg').hide();
                //$('#confirm_dialognew').style.display = "none";
                $('#confirm_dialog2').show();
                await delay(2000);
                $('#datebtn').click();
                $('#confirm_dialog2').hide();
                $('#toprighttxt').text(username +', Logged in at: '+ time);
                
                if (PlannerUI.signinCallback != null) {
                    PlannerUI.signinCallback();

                }
            } else {
                error.style.display = "block";
                error.innerHTML = "The username and/or password do not match the credentials that we have on file. Please try again or contact and administrator.";
            }
        } else {
            if (response.status == 401) {
                error.style.display = "block";
                error.innerHTML = "The username and/or password do not match the credentials that we have on file. Please try again or contact and administrator.";
            } else {
                error.style.display = "block";
                error.innerHTML = "An error occurred please check the server log or contact an administrator.";
            }
        }
    }

    public static async OnLogoutClick() {
         await fetch("/api/account/logout", {
            method: "POST",
            headers: [["Content-Type", "application/json"]]
         });
       // $('#confirm_dialogg').show();
        document.getElementById('mBody').style.display = "none";
        document.getElementById("buzz").style.display = "block";
    }

}
