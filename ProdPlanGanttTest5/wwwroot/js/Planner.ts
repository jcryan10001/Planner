/// <reference path="../js/lib/DHX/codebase/dhtmlxgantt.d.ts" />

import * as Gantt from "../js/lib/DHX/codebase/dhtmlxgantt";
import { PlannerUI } from "./PlannerUI";

//Javascript modules without ambient (*.d.ts) files
// @ts-ignore - moment was included by requirejs and is valid
import moment = require("moment");
// @ts-ignore - jquery was included by requirejs and is valid
//import $ = require("jquery");
declare var $: any;
//Syncfusion library was loaded via script tag
declare var ejs: any;

// @ts-ignore - loglevel was included by requirejs and is valid
import log = require("loglevel");
declare var gantt: Gantt.GanttStatic;
declare var srcapacities: any;

export interface JqueryEvent {
    preventDefault():any;
    target: any;
    pageX: number;
    pageY: number;
}

class NotAuthorisedError extends Error {
}

interface PlannerSearchCriteria {
}
interface PlannerFlatTask { }
interface PlannerInternalCapacity {
    ResCode: string;
    CapDate: Date;
    SngRunCap: number;
    WeekDay: number;
    WhsCode: string;
}
type tasklink = { id: string, source: string, target: string, type: string };
interface PlannerFlatData {
    timelinestart: Date;
    timelineend: Date;
    tasks: PlanningTask[];
    baselinetasks: PlanningTask[];
    internalcapacities: PlannerInternalCapacity[];
    links: tasklink[];
}
interface PlannerTaskOwner {
    resource_id: string;
    value: number;
}
type taskallocation = { "date": Date, "hours": number };
type taskplanning = 'mean' | 'exact';
export class PlanningSetupData {
    planning: taskplanning = 'mean';
    links: Array<tasklink> = [];
    allocations: Array<taskallocation> = [];
    totalallocation: number = 0;
}
export interface PlanningTask {
    open: boolean;
    Project: string;
    PNDescription: string;
    SODocNum: number;
    $level: number;
    $resource_id: string;
    StgName: string;
    VisOrder: number;
    POItemCode: string;
    POEndDate: Date;
    POStartDate: Date;
    PODocNum: number;
    LineNum: number;
    POStatus: string;
    ProjectEndDate: Date;
    ProjectStartDate: Date;
    ActivityEndDate: Date;
    ActivityStartDate: Date;
    calendar_id: string;
    owner: PlannerTaskOwner[];
    parent: string | number;
    PODocEntry: number;
    text: string;
    start_date: Date;
    end_date: Date;
    duration: number;
    id: string;
    StageID: string;
    PlannedHours: number;
    Resource: string;
    WhsCode: string;
    WPPSaved: boolean;
    $virtual: any;
    StartDate: Date;
    EndDate: Date;
    lead_time: number;
    progress: number;
    pro_progress: number;
    SODate: string;
    WPPSetup: string;
    OpDescription: string;
    status: string;
    originalPlannedQty: string;
    IssuedQuantity: number;
    BookedQuantity: number;
    _setup: PlanningSetupData;
}
function PlanningTask_UpdateSetup(pt: PlanningTask): void {
    pt.WPPSetup = JSON.stringify(pt._setup);
}
function PlanningTask_GetSetup(pt: PlanningTask): PlanningSetupData {
    if (pt._setup == null) {
        if (pt.WPPSetup != null) {
            pt._setup = JSON.parse(pt.WPPSetup);
            pt._setup.allocations.map(a => a.date = moment(a.date, "YYYY-MM-DD hh:mm:ss.SSSZ").toDate());
        }
    }
    if (pt._setup == null) {
        pt._setup = new PlanningSetupData();
    }
    return pt._setup;
}
export class PlanningResource {
    $resource_id: string;
    text: string;
    $task_id: string;
    $level: number;
    id: string;
    capacity: number;
}

export class SaveError extends Error {
    public pro: PlanningTask[] = null;
    public constructor(pro: PlanningTask[], message: string, name?: string, stack?: string) {
        super(message);

        this.pro = pro;
        if (name !== undefined) {
            this.name = name;
        }
        if (stack !== undefined) {
            this.stack = stack;
        }
    }
}

type prodord = { [DocEntry: number]: PlanningTask[] }

export type taskresourceentry = {
    //The start date and duration of the task when the data was
    //cached. If these values change, then it's a cache miss, and
    //the existing record needs to be deleted
    start_date: Date;
    duration: number;

    //number of working days in period
    workingdays: number;
    //number of nonworkingdays in period
    nonworkingdays: number;

    //total capacity available in this resource during task period
    capacity: number;
    //total allocation distributed per working or nonworking day
    allocation: number;
    //total allocation distributed in non-working days
    //kind of an error condition, happens when workingdays is zero
    nonworkingallocation: boolean;

    planning_setup: PlanningSetupData;
};

export type groupings = null |
    "production-order" | "sales-order" | "project-number" |
    "sales-order--production-order" |
    "project-number--production-order" |
    "project-number--sales-order" |
    "project-number--sales-order--production-order";
export class groupmarker implements PlanningTask {
    open: boolean;
    Project: string;
    PNDescription: string;
    SODocNum: number;
    StgName: string;
    VisOrder: number;
    POItemCode: string;
    POEndDate: Date;
    POStartDate: Date;
    public id: string;
    public text: string;
    public start_date: Date;
    public end_date: Date;
    public duration: number;
    public type: string;
    public marker_type: "production-order" | "production-order-stage" | "sales-order" | "project-number";
    public $level: number;
    public $resource_id: string;
    public Resource: string;
    public WhsCode: string;
    public PODocEntry: number;
    public LineNum: number;
    public StageID: string;
    public PlannedHours: number;
    public WPPSaved: boolean;
    public parent: string | number;
    public PODocNum: number;
    public ProjectEndDate: Date;
    public ProjectStartDate: Date;
    public ActivityEndDate: Date;
    public ActivityStartDate: Date;
    public calendar_id: string;
    public owner: PlannerTaskOwner[];
    public $virtual: any;
    public StartDate: Date;
    public EndDate: Date;
    public lead_time: number;
    public progress: number;
    public pro_progress: number;
    public POStatus: string;
    public SODate: string;
    WPPSetup: string;
    OpDescription: string;
    status: string;
    originalPlannedQty: string;
    IssuedQuantity: number;
    BookedQuantity: number;
    _setup: PlanningSetupData;

    public contains_resource(resource_id: string) {
        var c : number[] = gantt.getChildren(this.id);
        if (c.length > 0) {
            //find a task using the resource
            for (var t of c) {
                var ctask = <PlanningTask>gantt.getTask(t);
                if (ctask instanceof groupmarker) {
                    if (ctask.contains_resource(resource_id)) {
                        return true;
                    }
                }
                if (`${ctask.Resource}::${ctask.WhsCode}` == resource_id) {
                    return true;
                }
            }
        } else {
            return false;
        }
    }
    public contains_task(task_id : string) {
        var c : number[]  = gantt.getChildren(this.id);
        if (c.length > 0) {
            //find a task using the resource
            for (var t of c) {
                var ctask = <PlanningTask>gantt.getTask(t);
                if (ctask instanceof groupmarker) {
                    if (ctask.contains_task(task_id)) {
                        return true;
                    }
                }
                if (ctask.id == task_id) {
                    return true;
                }
            }
        } else {
            return false;
        }
    }

    public getDescendantTasks(): PlanningTask[] {
        var c: PlanningTask[] = gantt.getChildren(this.id).map(c => gantt.getTask(c));
        var ret: PlanningTask[] = [];
        if (c.length > 0) {
            ret = ret.concat(ret, c.filter(c => !(c instanceof groupmarker)));
            //find a task using the resource
            for (var ctask of c) {
                if (ctask instanceof groupmarker) {
                    var c2 = ctask.getDescendantTasks();
                    if (c2.length != 0) {
                        ret = ret.concat(c2);
                    }
                }
            }
        }
        return ret;
    }
}

type dirtytype = 'no' | 'auto-layout' | 'yes';

export class PlannerState {
    //In this system we just remember any task id that was opened and we always reopen matching bramches after loading
    //in this fashion, loading tasks with differing filters does not lose the open branch info
    public static OpenedTaskIds: string[] = [];

    public static CountOfResourceCellEvents = 0;

    public static BlockResourceCellEvents: boolean = false;  

    public static DAY_MS = 24 * 3600 * 1000;

    public static baseline: PlanningTask[] = [];

    //Original parsed task list - clones
    public static original: { [key: string]: PlanningTask } = {};

    //Capacity per resource::date
    public static capacitycache: { [key: string]: number } = {};
    //Capacity per task::resource
    public static taskresourcecache: { [key: string]: taskresourceentry; } = {};

    public static selectionmode: 'hide-none' | 'hide-task' | 'hide-resource' = 'hide-none';

    static _dirty : dirtytype = 'no';

    //During Data Load, we determined whether this screen is in edit mode or not
    //Will only return the value that is set when on the "/Edit" page - otherwise always return "false"
    static _readonlymode: boolean;
    static get readonlymode(): boolean {
        if (!this._usercanedit) {
            return true;
        }
        if (window.location.pathname == "/edit") {
            return PlannerState._readonlymode;
        } else {
            return true;
        }
    }
    static set readonlymode(value: boolean) {
        PlannerState._readonlymode = value;
        PlannerUI.InitGui();
    }

    //During Data Load, we determined whether this user could edit the data
    //Eventually we may use this setting to add an Edit button to read only view
    static _usercanedit: boolean;
    static get usercanedit(): boolean {
        return PlannerState._usercanedit;
    }
    static set usercanedit(value: boolean) {
        PlannerState._usercanedit = value;
        PlannerUI.InitGui();
    }

    public static get Dirty() : dirtytype {
        return PlannerState._dirty;
    };
    public static set Dirty(value: dirtytype) {
        PlannerState._dirty = value;
        PlannerUI.UpdateButtonState();
    };

    //GanttStatic has a bad signature for setParent - add a helper
    public static setParent(task: PlanningTask, new_parent_id: string | number) {
        gantt.setParent(<any>task, new_parent_id);
    }

    public static getAllocatedValue(tasks: PlanningTask[], resource: PlanningResource, start_date: Date): number {
        try {
            let START_MS = Number(start_date);

            let probe = (msg: string) => {
            };

            //Rab: It seems that DHX GANTT V7.1.8 doesn't always pass us all of the tasks - possible timezone issue?
            tasks = (<PlanningTask[]>gantt.getTaskByTime()).filter(t => `${t.Resource}::${t.WhsCode}` == resource.id && moment(t.start_date).format('YYYYMMDD') <= moment(start_date).format('YYYYMMDD') && moment(t.end_date).format('YYYYMMDD') >= moment(start_date).format('YYYYMMDD'));
            let baselinetasks = PlannerState.baseline.filter(t => `${t.Resource}::${t.WhsCode}` == resource.id && moment(t.StartDate).format('YYYYMMDD') <= moment(start_date).format('YYYYMMDD') && moment(t.EndDate).format('YYYYMMDD') >= moment(start_date).format('YYYYMMDD'));

            probe(`tasks: ${tasks.length} baselinetasks: ${baselinetasks.length}`);
            if (tasks.length == 0 && baselinetasks.length == 0) {
                return 0;
            }

            //The task list given to us needs no furthur filtering since the framework only passes tasks that hit a specific resource
            //for a specified date range
            //tasks = tasks.filter(t => t.Resource == resource.id && t.start_date >= start_date && (Number)(t.start_date) < START_MS + DAY_MS);

            probe(`tasks DocEntry/LineNum: ${tasks.map(t => t.id).join(", ")}`);
            probe(`baselinetasks DocNum/LineNum: ${baselinetasks.map(t => t.id).join(", ")}`);

            if (baselinetasks.length > 0) {
                tasks = tasks.concat(baselinetasks);
            }
            let result = 0.0;
            //there has to be an allocation from each on-screen task, and it has to be distributed over the working hours of the resource over the time window
            //of the task collect the calendar info for each date touched, then distribute PlannedQty
            //by percent
            for (let t of tasks) {
                let setup: PlanningSetupData = null;
                probe(`tasks: ALLOCATION CONSIDERING TASK: ${t.id}`);

                var dt = (Number)(t.start_date);
                var edt = (Number)(t.end_date);
                //look in cache for the initial data
                let key = `${t.id}::${resource.id}`;
                let tr: taskresourceentry = PlannerState.taskresourcecache[key];
                if (tr !== undefined) {
                    setup = PlanningTask_GetSetup(t);
                    if (tr.start_date != t.start_date || tr.duration != t.duration || setup.planning != tr.planning_setup.planning) {
                        delete PlannerState.taskresourcecache[key];
                        tr = null;
                    }
                }
                if (tr == null) {
                    if (setup == null) {
                        setup = PlanningTask_GetSetup(t);
                    }
                    //calculate the daily allocation data
                    tr = <taskresourceentry>{
                        start_date: t.start_date,
                        duration: t.duration,

                        workingdays: 0,
                        nonworkingdays: 0,

                        allocation: 0,
                        capacity: 0,

                        nonworkingallocation: false,

                        planning_setup: setup
                    };
                    PlannerState.taskresourcecache[key] = tr;

                    for (let d = 1; d <= t.duration; d++, dt = dt + PlannerState.DAY_MS) {
                        let daycap = PlannerState.getCapacity(dt, resource);
                        if (daycap == 0) {
                            tr.nonworkingdays++;
                        } else {
                            tr.workingdays++;
                            tr.capacity += daycap;
                        }
                    }
                    tr.nonworkingallocation = tr.workingdays == 0;
                    if (setup.planning == "mean") {
                        if (!tr.nonworkingallocation) {
                            tr.allocation = t.PlannedHours / tr.workingdays;
                        } else {
                            tr.allocation = t.PlannedHours / tr.nonworkingdays;
                        }
                    } else {
                        tr.allocation = 0;
                    }
                }
                if (tr.planning_setup.planning == 'mean') {
                    //now add the allocation for the day
                    if (tr.nonworkingallocation) {
                        //in non working allocation, all days in the task date range must be non working
                        probe(`tasks: MEAN MODE ALLOCATION for ${t.id}, allocation: ${tr.allocation}`);
                        result += tr.allocation;
                    } else {
                        //it's a working time allocation, we don't allocate to non-working days
                        let daycap = PlannerState.getCapacity(start_date, resource);
                        if (daycap != 0) {
                            probe(`tasks: MEAN MODE ALLOCATION for ${t.id}, allocation: ${tr.allocation}`);
                            result += tr.allocation;
                        }
                    }
                } else {
                    //log.info(`Exact allocation call Date=${start_date.toISOString()} id=${t.id}`);
                    let alloc = tr.planning_setup.allocations.filter(a => moment(a.date).format('YYYYMMDD') == moment(start_date).format('YYYYMMDD'));
                    if (alloc.length != 0) {
                        probe(`tasks: EXACT MODE ALLOCATION for ${t.id}, allocation: ${alloc[0].hours}`);
                        result += alloc[0].hours;
                    }
                }
            }

            probe(`tasks: ALLOCATION VALUE: ${result}`);
            return result;
        } catch (e) {
            log.error(`Fault in getAllocatedValue: ${e.toString()}`);
            return 0;
        }
    }
    public static round2dp(n: number) {
        return Math.round(n * 100) / 100;
    }
    public static getResourceCellComponents(resourceid: string, start_date: Date): string {
        try {
            let START_MS = Number(start_date);
            let resource = PlannerState.getResource(resourceid);

            let probe = (msg: string) => {
            };

            var tasks = (<PlanningTask[]>gantt.getTaskByTime()).filter(t => `${t.Resource}::${t.WhsCode}` == resourceid && moment(t.start_date).format('YYYYMMDD') <= moment(start_date).format('YYYYMMDD') && moment(t.end_date).format('YYYYMMDD') >= moment(start_date).format('YYYYMMDD'));
            let baselinetasks = PlannerState.baseline.filter(t => `${t.Resource}::${t.WhsCode}` == resourceid && moment(t.StartDate).format('YYYYMMDD') <= moment(start_date).format('YYYYMMDD') && moment(t.EndDate).format('YYYYMMDD') >= moment(start_date).format('YYYYMMDD'));

            probe(`tasks: ${tasks.length} baselinetasks: ${baselinetasks.length}`);
            if (tasks.length == 0 && baselinetasks.length == 0) {
                return "";
            }

            //The task list given to us needs no furthur filtering since the framework only passes tasks that hit a specific resource
            //for a specified date range
            //tasks = tasks.filter(t => t.Resource == resource.id && t.start_date >= start_date && (Number)(t.start_date) < START_MS + DAY_MS);

            probe(`tasks DocNum/LineNum: ${tasks.map(t => t.id).join(", ")}`);
            probe(`baselinetasks DocNum/LineNum: ${baselinetasks.map(t => t.id).join(", ")}`);


            if (baselinetasks.length > 0) {
                tasks = tasks.concat(baselinetasks);
                (<any>baselinetasks).isbaseline = true;
            }


            let result = 0.0;
            var component_report = '';

            //there has to be an allocation from each on-screen task, and it has to be distributed over the working hours of the resource over the time window
            //of the task collect the calendar info for each date touched, then distribute PlannedQty
            //by percent
            for (let t of tasks) {
                let reportcolour = (<any>baselinetasks).isbaseline === true ? "lightblue" : "lightgreen";

                let setup: PlanningSetupData = null;
                probe(`tasks: ALLOCATION CONSIDERING TASK: ${t.id}`);

                var dt = (Number)(t.start_date);
                var edt = (Number)(t.end_date);
                //look in cache for the initial data
                let key = `${t.id}::${resourceid}`;
                let tr: taskresourceentry = PlannerState.taskresourcecache[key];
                if (tr !== undefined) {
                    setup = PlanningTask_GetSetup(t);
                    if (tr.start_date != t.start_date || tr.duration != t.duration || setup.planning != tr.planning_setup.planning) {
                        delete PlannerState.taskresourcecache[key];
                        tr = null;
                    }
                }
                if (tr == null) {
                    if (setup == null) {
                        setup = PlanningTask_GetSetup(t);
                    }
                    //calculate the daily allocation data
                    tr = <taskresourceentry>{
                        start_date: t.start_date,
                        duration: t.duration,

                        workingdays: 0,
                        nonworkingdays: 0,

                        allocation: 0,
                        capacity: 0,

                        nonworkingallocation: false,

                        planning_setup: setup
                    };
                    PlannerState.taskresourcecache[key] = tr;

                    for (let d = 1; d <= t.duration; d++, dt = dt + PlannerState.DAY_MS) {
                        let daycap = PlannerState.getCapacity(dt, resource);
                        if (daycap == 0) {
                            tr.nonworkingdays++;
                        } else {
                            tr.workingdays++;
                            tr.capacity += daycap;
                        }
                    }
                    tr.nonworkingallocation = tr.workingdays == 0;
                    if (setup.planning == "mean") {
                        if (!tr.nonworkingallocation) {
                            tr.allocation = t.PlannedHours / tr.workingdays;
                        } else {
                            tr.allocation = t.PlannedHours / tr.nonworkingdays;
                        }
                    } else {
                        tr.allocation = 0;
                    }
                }
                if (tr.planning_setup.planning == 'mean') {
                    //now add the allocation for the day
                    if (tr.nonworkingallocation) {
                        //in non working allocation, all days in the task date range must be non working
                        probe(`tasks: MEAN MODE ALLOCATION for ${t.id}, allocation: ${tr.allocation}`);
                        result += tr.allocation;                        
                        component_report += `&nbsp;&nbsp;<span style="color: ${reportcolour}">${t.PODocNum}/${t.LineNum}: ${PlannerState.round2dp(tr.allocation)}</span><br>`;
                    } else {
                        //it's a working time allocation, we don't allocate to non-working days
                        let daycap = PlannerState.getCapacity(start_date, resource);
                        if (daycap != 0) {
                            probe(`tasks: MEAN MODE ALLOCATION for ${t.id}, allocation: ${tr.allocation}`);
                            result += tr.allocation;
                            component_report += `&nbsp;&nbsp;<span style="color: ${reportcolour}">${t.PODocNum}/${t.LineNum}: ${PlannerState.round2dp(tr.allocation) }</span><br>`;
                        }
                    }
                } else {
                    //log.info(`Exact allocation call Date=${start_date.toISOString()} id=${t.id}`);
                    let alloc = tr.planning_setup.allocations.filter(a => moment(a.date).format('YYYYMMDD') == moment(start_date).format('YYYYMMDD'));
                    if (alloc.length != 0) {
                        probe(`tasks: EXACT MODE ALLOCATION for ${t.id}, allocation: ${alloc[0].hours}`);
                        result += alloc[0].hours;
                        component_report += `&nbsp;&nbsp;<span style="color: ${reportcolour}">${t.PODocNum}/${t.LineNum}: ${PlannerState.round2dp(alloc[0].hours)}</span><br>`;
                    }
                }
            }

            probe(`tasks: ALLOCATION VALUE: ${result}`);
            //console.log(`Capacity: ${PlannerState.getCapacity(start_date, resource)}<br>` + component_report + `&nbsp;&nbsp;<strong>Total: ${result}</strong><br>`);
            return `<div>Capacity: ${PlannerState.getCapacity(start_date, resource)}<br>` + component_report + `&nbsp;&nbsp;<strong>Total: ${PlannerState.round2dp(result)}</strong></div>`;
        } catch (e) {
            log.error(`Fault in getAllocatedValue: ${e.toString()}`);
            return "";
        }
    }

    public static getResource(resource_id: string) {
        let actual_resource : PlanningResource = (<any>gantt).$resourcesStore.getItem(resource_id);
        return actual_resource;
    }

    public static getAllocatedValueForTaskResource(resource: PlanningResource, start_date: Date): number {
        try {
            //The time span of the task is not considered by the caller and so each cell that
            //is visible would get a number written if we didn't write it here
            let task = gantt.getTask(resource.$task_id) as PlanningTask;
            if (moment(task.start_date).format("YYYYMMDD") != moment(start_date).format("YYYYMMDD")) { return 0; }

            let key = `${resource.$task_id}::${resource.$resource_id}`;
            let tr = PlannerState.taskresourcecache[key];
            if (tr != null) {
                if (tr.start_date != task.start_date || tr.duration != task.duration) {
                    delete PlannerState.taskresourcecache[key];
                    tr = null;
                }
            }
            if (tr == null) {
                let actual_resource = PlannerState.getResource(resource.$resource_id);
                PlannerState.getAllocatedValue([task], actual_resource, start_date);
                tr = PlannerState.taskresourcecache[key];
            }
            if (tr.planning_setup.planning == 'mean') {
                //now add the allocation for the day
                if (tr.nonworkingallocation) {
                    //in non working allocation, all days in the task date range must be non working
                    return tr.allocation;
                } else {
                    //it's a working time allocation, we don't allocate to non-working days
                    let daycap = PlannerState.getCapacity(start_date, resource);
                    if (daycap != 0) {
                        return tr.allocation;
                    } else {
                        return 0;
                    }
                }
            } else {
                let alloc = tr.planning_setup.allocations.filter(a => moment(a.date).format("YYYYMMDD") == moment(start_date).format("YYYYMMDD"));
                if (alloc.length != 0) {
                    return alloc[0].hours;
                }
            }

        } catch (e) {
            log.error(`Fault in getAllocatedValueForTaskResource: ${e.toString()}`);
            return 0;
        }
    }

    public static DeserializeBaseline(data: PlanningTask[]) {
        try {
            PlannerState.baseline = data.map(i => {
                var o = Object.assign({}, i);

                if (o.duration < 1) {
                    o.duration = 1;
                }
                o.POStartDate = new Date(Date.parse(<any>i.POStartDate as string));
                o.POEndDate = new Date(Date.parse(<any>i.POEndDate as string));
                o.start_date = new Date(Date.parse(<any>i.start_date as string));
                o.StartDate = o.start_date;
                o.EndDate = new Date(Number(o.start_date) + this.DAY_MS * o.duration);

                return o;
            });
        } catch (e) {
            log.error(`Fault in DeserializeBaseline: ${e.toString()}`);
            return 0;
        }
    }

    public static async GroupBy(grp: groupings, tasks: PlanningTask[]) {
        //var toremove: string[] = [];
        var taskref: PlanningTask[] = [];
        var taskgroups: { [groupkey: string]: PlanningTask[] } = {};
        var grouporder: string[] = [];

        if (tasks != null) {
            taskref = tasks;
        } else {
            try {
                log.debug(`Begin data collect Time=${new Date()}`);
                gantt.eachTask((t: PlanningTask) => {
                    if (t instanceof groupmarker) {
                        //use unshift instead of push this ensures that nested markers get deleted first
                        //toremove.unshift(t.id);
                        ;
                    } else {
                        PlannerState.setParent(t, gantt.config.root_id);
                        gantt.refreshTask(t.id, true);
                        taskref.push(t);
                    }
                });
                log.debug(`End data collect Time=${new Date()}`);
            } catch (e) {
                log.error(e.toString());
            }
        }

        //Try and do a grouping of the data in a single iteration pass
        try {
            log.debug(`Begin group data Time=${new Date()}`);

            log.debug(`PlannerState.CountOfResourceCellEvents = ${PlannerState.CountOfResourceCellEvents}`)

            let lastgkey = '';
            let grouparray: PlanningTask[] = [];
            for (let T of taskref) {
                if (T instanceof groupmarker) {
                    continue;
                }

                let gkey = ''; 
                let activekeys: string[] = [];
                let activevalues: any[] = [];
                let keygroups = grp.split("--");

                for (var keygroup of keygroups) {
                    switch (keygroup) {
                        case "production-order":
                            if (T.PODocNum != null) {
                                activekeys.push("PODocNum");
                                activevalues.push(T.PODocNum);
                            }
                            if (T.StageID != null) {
                                activekeys.push("StageID");
                                activevalues.push(T.StageID);
                            }
                            break;
                        case "sales-order":
                            if (T.SODocNum != null) {
                                activekeys.push("SODocNum");
                                activevalues.push(T.SODocNum);
                            }
                            break;
                        case "project-number":
                            if (T.Project != null) {
                                activekeys.push("Project");
                                activevalues.push(T.Project);
                            }
                            break;
                    }
                }
                gkey = `${activekeys.join(",")}:${activevalues.map(i => ('                         ' + i.toString()).slice(-25)).join(",")}`;
                if (gkey !== lastgkey) {
                    if (taskgroups[gkey] === undefined) {
                        grouporder.push(gkey);
                        taskgroups[gkey] = [];
                    }
                    grouparray = taskgroups[gkey];
                }
                grouparray.push(T);
            };

            log.debug(`Data grouped Time=${new Date()}`);
        } catch (e) {
            log.error(e.toString());
        }

        log.debug(`PlannerState.CountOfResourceCellEvents = ${PlannerState.CountOfResourceCellEvents}`)

        try {
            log.debug(`Begin orginize tree Time=${new Date()}`);

            //need to sort the group orders
            grouporder.sort();

            //Clearing the tasks store and reloading it is quicker than deleting some items
            (<any>gantt).$data.tasksStore.clearAll();

            type keyheaderdef = { value: any, id: string };

            let activeheaders: { [fieldname: string]: keyheaderdef } = {};
            let allheaders: string[] = [];

            let idlebreak = 0;

            for (let groupkey of grouporder) {

                //Rab: This loop can be long running - need to break to despatcher to avoid the tab has hung error
                idlebreak++;
                if (idlebreak % 20 == 0) {
                    await $.Deferred().resolve({ status: "OK" }).promise();
                }

                //log.debug(`Begin orginize group Key=${groupkey} Time=${new Date()}`);

                let grouptasks = taskgroups[groupkey];

                //we need to build headers to create an insert point, we must however share headers where they have the same value
                //build from level 1 to level x
                var keybits = groupkey.split(":");
                var keys = keybits[0].split(",");
                let currentparent = null; // gantt.config.root_id;
                let level = 0;
                if (groupkey != ":") {
                    for (let key of keys) {
                        let item = grouptasks[0];
                        let header = new groupmarker();
                        if (activeheaders[key] === undefined || activeheaders[key].value != (<any>(item))[key]) {
                            //create the new header
                            switch (key) {
                                case "Project":
                                    header.id = `GM-prj-${item[key]}`;
                                    header.text = !item[key] ? "No Project" : `Project ${item[key]}: ${item.PNDescription}`;
                                    header.type = gantt.config.types.task;
                                    header.marker_type = "project-number";
                                    header.duration = 365;
                                    if (grouptasks[0].ProjectStartDate != null) {
                                        header.start_date = grouptasks[0].ProjectStartDate;
                                    } else {
                                        header.start_date = grouptasks.filter(t => t.start_date != null).reduce((pv: Date, cv: PlanningTask) => (pv == null || new Date(cv.start_date).getTime() < pv.getTime()) ? new Date(cv.start_date) : new Date(pv), null);
                                    }
                                    if (grouptasks[0].ProjectEndDate != null) {
                                        header.end_date = grouptasks[0].ProjectEndDate;
                                    } else {
                                        header.end_date = grouptasks.filter(t => t.start_date != null).reduce((pv: Date, cv: PlanningTask) => (pv == null || moment(cv.start_date).add(cv.duration, 'days').valueOf() > pv.getTime()) ? moment(cv.start_date).add(cv.duration, 'days').toDate() : new Date(pv), null);
                                    }
                                    if (header.end_date == null) {
                                        header.end_date = new Date(header.start_date);
                                    }

                                    grouptasks.map((t:any) => { t.parent = header.id; });
                                    break;
                                case "SODocNum":
                                    header.id = `GM-so-${item[key]}`;
                                    header.text = !item[key] ? "No Order" : `Order ${item[key]}`;
                                    header.type = gantt.config.types.project;
                                    header.marker_type = "sales-order";
                                    break;
                                case "PODocNum":
                                    header.id = `GM-po-${item[key]}`;
                                    header.text = `Prod ${item[key]}: ${item.POItemCode}`;
                                    header.type = gantt.config.types.project;
                                    header.marker_type = "production-order";
                                    header.PODocEntry = grouptasks[0].PODocEntry;
                                    header.progress = grouptasks[0].pro_progress;
                                    header.WPPSaved = grouptasks[0].WPPSaved;
                                    break;
                                case "StageID":
                                    header.id = `GM-po-${item[key]}-st-${item.StageID}`;
                                    header.text = `${item.StgName}`;
                                    header.type = gantt.config.types.project;
                                    header.marker_type = "production-order-stage";
                                    break;
                            };
                            
                            //gantt.addTask(header);
                            taskref.push(header);
                            //PlannerState.setParent(gantt.getTask(header.id), currentparent);
                            header.parent = currentparent;
                            header.$level = level;
                            currentparent = header.id;
                            activeheaders[key] = { id: header.id, value: (<any>item)[key] };
                            allheaders.push(header.id);
                        } else {
                            currentparent = activeheaders[key].id;
                        }
                        level++;
                    }
                }

                //parent the group to the last header
                for (let T of grouptasks) {
                    //PlannerState.setParent(T, currentparent);
                    T.parent = currentparent;
                    T.$level = level;
                }

                //log.debug(`End orginize group Key=${groupkey} Time=${new Date()}`);
            }

            log.debug(`End organize tree Time=${new Date()}`);

            gantt.parse({ tasks: taskref });

            log.debug(`End gantt.parse=${new Date()}`);

            //recalculate the projects and place root marker son the board
            for (let id of allheaders) {
                var header = gantt.getTask(id);
                gantt.resetProjectDates(header);
            }

            log.debug(`End recalc tree Time=${new Date()}`);

            log.debug(`PlannerState.CountOfResourceCellEvents = ${PlannerState.CountOfResourceCellEvents}`)

            log.debug(`Call gantt.refreshData Time=${new Date()}`);
            gantt.refreshData();
            log.debug(`End Call gantt.refreshData Time=${new Date()}`);

            log.debug(`PlannerState.CountOfResourceCellEvents = ${PlannerState.CountOfResourceCellEvents}`)

            //Open any branches that we have in our list
            for (let openid of PlannerState.OpenedTaskIds) {
                gantt.open(openid);
            }
            $('#confirm_dialog3').hide();
        } catch (e) {
            log.error(`Fault in GroupBy: ${e.toString()}`);
            $('#confirm_dialog3').hide();
        }
    }

    public static getCapacity(date: number | Date, resource: PlanningResource): number {
        let resource_id = resource.$level == 2 ? resource.$resource_id : resource.id;
        var capcachekey = `${resource_id}/${moment(date).format('YYYY/MM/DD')}`;
        return PlannerState.capacitycache[capcachekey] || 0;
    }
    public static shouldDisplayTask(task: PlanningTask): boolean {
        try {


            var store = (<any>gantt).$resourcesStore;
            var selectedResourceId = store.getSelectedId();
            //No hide if we didn't select a resource - we also don't mark tasks based on a department
            if (selectedResourceId == null) {
                return true;
            }

            var selectedResource = PlannerState.getResource(selectedResourceId);

            if (selectedResource == null || selectedResource.$level == 0) {
                return true;
            }

            var resDate = $('#resDate').text();
            if (!!resDate) {
                var tStart = new Date(task.start_date);
                var tEnd = new Date(task.end_date);
                var dateToChk = new Date(resDate);
                //if date is present then find out if the date checks out
                if (dateToChk >= tEnd || dateToChk <= tStart) {
                    return false;
                }
            }

            //The resource was a single resource value
            if (selectedResource.$level == 1) {
                //if this task is a marker, ask the marker
                if (task instanceof groupmarker) {
                    return task.contains_resource(selectedResourceId);
                }

                //if the resource matches exactly, hilight it
                if (`${task.Resource}::${task.WhsCode}` == selectedResourceId) {
                    return true;
                } else {
                    return false;
                }
            }

            //A task row has been selected
            if (selectedResource.$level == 2) {
                //if this task is a marker, ask the marker
                if (task instanceof groupmarker) {
                    return task.contains_task(selectedResource.$task_id);
                }

                //if the resource matches exactly, hilight it
                if (task.id == selectedResource.$task_id) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (e) {
            log.error(`Fault in shouldDisplayTask: ${e.toString()}`);
            return false;
        }
    }
    public static shouldHighlightTask(task: PlanningTask):boolean {
        try {
            var store = (<any>gantt).$resourcesStore;
            var selectedResourceId = store.getSelectedId();

            //No hilight if we didn't select a resource - we also don't mark tasks based on a department
            if (selectedResourceId == null) {
                return false;
            }

            var selectedResource = PlannerState.getResource(selectedResourceId);

            if (selectedResource == null || selectedResource.$level == 0) {
                return false;
            }
            var resDate = $('#resDate').text();
            if (!!resDate) {
                var tStart = new Date(task.start_date);
                var tEnd = new Date(task.end_date);
                var dateToChk = new Date(resDate);
                //if date is present then find out if the date checks out
                if (dateToChk >= tEnd || dateToChk <= tStart) {
                    return false;
                }
            }

            //The resource was a single resource value
            if (selectedResource.$level == 1) {
                //if this task is a marker, ask the marker
                if (task instanceof groupmarker) {
                    return task.contains_resource(selectedResourceId);
                }

                //if the resource matches exactly, hilight it
                if (`${task.Resource}::${task.WhsCode}` == selectedResourceId) {
                    return true;
                } else {
                    return false;
                }
            }

            //A task row has been selected
            if (selectedResource.$level == 2) {
                //if this task is a marker, ask the marker
                if (task instanceof groupmarker) {
                    return task.contains_task(selectedResource.$task_id);
                }

                //if the resource matches exactly, hilight it
                if (task.id == selectedResource.$task_id) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (e) {
            log.error(`Fault in shouldHghlightTask: ${e.toString()}`);
            return false;
        }
    }

    

    public static shouldHighlightResource(resource: PlanningResource) {
        try {
            var selectedTaskId = gantt.getSelectedId();

            //if there is no selected task, display
            if (selectedTaskId == null) {
                return true;
            }

            //we only deal with actual tasks
            var task = <PlanningTask>gantt.getTask(selectedTaskId);
            //this is the resource folder so we always allow it
            if (resource.$level == 0) {
                return true;
            }
            //this is single resource folder, the only resources we pass are the once that contains that task
            if (resource.$level == 1) {
                if (task instanceof groupmarker) {
                    if (task.contains_resource(resource.id)) {
                        return true;
                    }
                    else { return false; }
                }

                if (`${task.Resource}::${task.WhsCode}` == resource.id) {
                    return true;
                } else {
                    return false;
                }
            }
            //this is the actual single resources 
            if (resource.$level == 2) {
                if (task instanceof groupmarker) {

                    let g2: any = gantt.getChildren(task.id);
                    if (g2.includes(resource.$task_id)) {
                        return true;
                    }
                    else { return false; }

                }
            }
        } catch (e) {
            log.error(`Fault in shouldHghlightResource: ${e.toString()}`);
            return false;
        }
    }



    public static shouldDisplayResource(resource: PlanningResource) {
        try {
            var selectedTaskId = gantt.getSelectedId();

            //if there is no selected task, display
            if (selectedTaskId == null) {
                return true;
            }

            //we only deal with actual tasks
            var task = <PlanningTask>gantt.getTask(selectedTaskId);
           //this is the resource folder so we always allow it
            if (resource.$level == 0) {
                return true;
            }
            //this is single resource folder, the only resources we pass are the once that contains that task
            if (resource.$level == 1) {
                if (task instanceof groupmarker) {
                    if (task.contains_resource(resource.id)) {
                        return true;
                    }
                    else { return false; }
                }
                
                if (`${task.Resource}::${task.WhsCode}` == resource.id) {
                    return true;
                } else {
                    return false;
                }
            }
            //this is the actual single resources 
            if (resource.$level == 2) {
                if (task instanceof groupmarker) {

                    let g2: any = gantt.getChildren(task.id);
                    if (g2.includes(resource.$task_id)) {
                        return true;
                    }
                    //else { return false; }

                }
                if (`${task.id}_${task.calendar_id}` == resource.id) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (e) {
            log.error(`Fault in shouldDisplayResource: ${e.toString()}`);
            return false;
        }
    }

    public static findTimeslot(first_date: any, resource_key: string): [Date, number] {
        try {
            var date: any = moment.utc(first_date.format("YYYY-MM-DD"));
            var capacity: number;

            var daysseen = 0;
            while (daysseen++ != 365) {
                let resource = PlannerState.getResource(resource_key);
                capacity = this.getCapacity(date.toDate(), resource);
                if (capacity != 0) {
                    return [moment(date), capacity];
                }
                date = moment(date).add(1, 'days');
            }

            //If there isn't any available capacity for 365 days, return 8 hours on the originally requested day
            //TODO: Maybe we need an onscreen message for unconfigured capacity
            return [moment.utc(first_date.format("YYYY-MM-DD")), 8];
        } catch (e) {
            log.error(`Fault in findTimeslot: ${e.toString()}`);
        }
    }

    public static async ForwardPlanTask(taskId: string) {
        //log.info(`Begin Forward Planning for taskId ${taskId}`);
        var task = <PlanningTask>gantt.getTask(taskId);
        if (task.PODocEntry != null) {
            await PlannerState.ForwardPlanDocEntry(task.PODocEntry);
        }
    }

    public static ForwardPlanInProgress: boolean = false;
    public static async ForwardPlanDocEntry(DocEntry: number) {
        type planningstep = Array<PlanningTask>;
        PlannerState.ForwardPlanInProgress = true;
        try {
            //log.info(`Begin Forward Planning for PrO entry = ${DocEntry}`);

            var planobjects = (<PlanningTask[]>gantt.getTaskByTime()).filter(t => t.PODocEntry == DocEntry && !(t instanceof groupmarker));

            var is_routed = ((planobjects[0].StageID || '') != '');

            var scan_date: any = planobjects.reduce((pv: Date, cv: PlanningTask) => (pv == null || cv.start_date.getTime() < pv.getTime()) ? new Date(cv.start_date) : pv, null);
            scan_date = moment.utc(moment(scan_date).format("YYYY-MM-DD"));

            var timeslot_date: Date = null;
            var timeslot_hours: number = 0;

            //need a nice quick id lookup
            var planobjectslookup: { [id: string]: PlanningTask } = {};
            var todo: string[] = [];
            for (var po of planobjects) {
                planobjectslookup[po.id] = po;
                todo.push(po.id);
            }

            //**** We need to work out how the planobjects are to be grouped into steps
            var linkids = planobjects.reduce((pv, cv) => { return pv.concat(<string[]>(<any>cv).$source) }, []);
            var links: tasklink[] = [];
            for (var linkid of linkids) {
                var link: tasklink = gantt.getLink(linkid);
                //we really only want End -> Start links, type 0
                if (link.type == "0") {
                    links.push(link);
                }
            }
            var steps: Array<planningstep> = [];
            //We'll start with item [0] on it's own, removing the key from the todo list
            steps.push([planobjects[0]]);
            todo = todo.filter(po_id => po_id != planobjects[0].id);
            var laststep = steps[steps.length-1];
            while (todo.length > 0) {
                //for subsequent steps, we follow the successor links (if present), or else use the next item on the todo list
                var nextids = links.filter(l => laststep.some(t => t.id == l.source))
                    .reduce((pv, cv) => { pv.push(cv.target); return pv; }, []);

                var nextids = nextids.filter((v, i, a) => a.indexOf(v) === i);

                if (nextids.length == 0) {
                    nextids = [todo[0]];
                }

                steps.push(nextids.map(nid => planobjectslookup[nid]));

                todo = todo.filter(id => nextids.indexOf(id) == -1);

                laststep = steps[steps.length - 1];
            }

            type scanpointer = { scan_date: any, timeslot_date: Date, timeslot_hours: number };
            let scanpointers: { [resource_id: string]: scanpointer } = {
                "__step_time": {
                    scan_date: scan_date,
                        timeslot_date: timeslot_date,
                        timeslot_hours: timeslot_hours
                    }
                };  

            //work through plan objects and then logically assign them to available time
            //slots finally collect the logical dates back on to the object
            for (var stp of steps) {

                //at the start of a step, the current scan pointer is set to the most progressed scanpointer
                //this allows the date to advance to the next step at the same time for all resources
                //this does not produce the most efficient plan however, but does explicitly follow arrows first
                for (var sp of Object.keys(scanpointers)) {
                    if (scanpointers[sp].timeslot_date > timeslot_date ||
                        scanpointers[sp].timeslot_date == timeslot_date && scanpointers[sp].timeslot_hours < timeslot_hours) {
                        scan_date = scanpointers[sp].scan_date;
                        timeslot_date = scanpointers[sp].timeslot_date;
                        timeslot_hours = scanpointers[sp].timeslot_hours;
                    }
                }

                //we store the starting pointer for the current step
                scanpointers["__step_time"] = {
                    scan_date: scan_date,
                    timeslot_date: timeslot_date,
                    timeslot_hours: timeslot_hours
                };

                //we need to split the step data by resource and by whether there is a leadtime or not
                //first we can iterate each item - those that have a lead time can be processed immediately
                //those that do not have a leadtime will be arranged by resource for later processing
                let byresource: { [resource_id: string]: PlanningTask[] } = {};

                for (var tos of stp) {
                    if ((tos.lead_time || 0) > 0) {
                        //even though we already have an aligned scan pointer, this task may not be dependent upon it
                        //work out resource dependencies, and recalculate the start point again
                        var ptrs: scanpointer[] = [];
                        if (scanpointers[tos.calendar_id] !== undefined) {
                            ptrs.push(scanpointers[tos.calendar_id]);
                        }
                        if ((<any>tos).$target.length > 0) {
                            var prevtasks: string[] = (<any>tos).$target.map((l: string) => gantt.getLink(l).source);
                            for (var depT of <any>prevtasks.map(t => gantt.getTask(t))) {
                                ptrs.push(depT.__scanpointer);
                            }
                        }
                        if (ptrs.length > 0) { 
                            ptrs.sort((a, b) => {
                                if (moment(a.scan_date().valueOf() > moment(b.scan_date).valueOf())) {
                                    return -1;
                                } else if (moment(a.scan_date).valueOf() < moment(b.scan_date).valueOf()) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            });

                            ptrs = ptrs.filter(p => moment(p.scan_date).format("YYYY-MM-DD") == moment(ptrs[0].scan_date).format("YYYY-MM-DD"));
                            ptrs.sort((a, b) => {
                                if (a.timeslot_hours < b.timeslot_hours) {
                                    return -1;
                                } else if (a.timeslot_hours > b.timeslot_hours) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            });

                            scan_date = ptrs[0].scan_date;
                            timeslot_date = ptrs[0].timeslot_date;
                            timeslot_hours = ptrs[0].timeslot_hours;
                        }

                        //if we have a lead time, then it's a number of days and should be planned onto the gannt as that many days
                        calculated_start_date = moment(scan_date);
                        scan_date = moment(calculated_start_date).add(tos.lead_time, 'days');
                        timeslot_hours = 0;

                        //scan date is always one day beyond timeslot and that's the date that we need
                        var calculated_end_date = moment(scan_date);

                        //store the new times into our objects
                        var duration = gantt.calculateDuration({ start_date: calculated_start_date.toDate(), end_date: calculated_end_date.toDate() });
                        tos.start_date = calculated_start_date.toDate();
                        tos.end_date = calculated_end_date.toDate();
                        tos.duration = duration;

                        //a lead_time task has a fixed allocation of nothing, this is
                        //because lead_time tasks are used to indicate a task which takes
                        //time but does not use an internal resource
                        let setup = PlanningTask_GetSetup(tos);
                        setup.allocations = [];
                        setup.planning = "exact";
                        setup.totalallocation = 0;
                        PlanningTask_UpdateSetup(tos);

                        (<any>tos).__scanpointer = <scanpointer>{
                            scan_date: moment(scan_date),
                            timeslot_date: moment(timeslot_date),
                            timeslot_hours: timeslot_hours
                        };
                        scanpointers[tos.calendar_id] = {
                            scan_date: moment(scan_date),
                            timeslot_date: moment(timeslot_date),
                            timeslot_hours: timeslot_hours
                        };
                    } else {
                        var resourcetasks = byresource[tos.calendar_id] || [];
                        resourcetasks.push(tos);
                        byresource[tos.calendar_id] = resourcetasks;
                    }
                }

                for (var resource_id of Object.keys(byresource)) {
                    //the step counter is reset for each resource
                    scan_date = scanpointers["__step_time"].scan_date;
                    timeslot_date = scanpointers["__step_time"].timeslot_date;
                    timeslot_hours = scanpointers["__step_time"].timeslot_hours;

                    resourcetasks = byresource[resource_id];
                    for (var tos of resourcetasks) {
                        //even though we already have an aligned scan pointer, this task may not be dependent upon it
                        //work out resource dependencies, and recalculate the start point again
                        var ptrs: scanpointer[] = [];
                        if (scanpointers[tos.calendar_id] !== undefined) {
                            ptrs.push(scanpointers[tos.calendar_id]);
                        }
                        if ((<any>tos).$target.length > 0) {
                            var prevtasks: string[] = (<any>tos).$target.map((l: string) => gantt.getLink(l).source);
                            for (var depT of <any>prevtasks.map(t => gantt.getTask(t))) {
                                ptrs.push(depT.__scanpointer);
                            }
                        }
                        if (ptrs.length > 0) {
                            ptrs.sort((a, b) => {
                                if (a.scan_date > b.scan_date) {
                                    return -1;
                                } else if (a.scan_date < b.scan_date) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            });

                            ptrs = ptrs.filter(p => p.scan_date == ptrs[0].scan_date);
                            ptrs.sort((a, b) => {
                                if (a.timeslot_hours < b.timeslot_hours) {
                                    return -1;
                                } else if (a.timeslot_hours > b.timeslot_hours) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            });

                            scan_date = moment(ptrs[0].scan_date);
                            timeslot_date = moment(ptrs[0].timeslot_date);
                            timeslot_hours = ptrs[0].timeslot_hours;
                        }

                        var resource = PlannerState.getResource(`${tos.Resource}::${tos.WhsCode}`);
                        //reset the fixed allocations, 
                        let setup = PlanningTask_GetSetup(tos);
                        setup.allocations = [];
                        setup.planning = "exact";
                        setup.totalallocation = 0;

                        if (resource == null) {
                            //console.warn(`No lead time and no resource attachment - id: ${tos.id} - applying 1 day`);
                            calculated_start_date = moment(scan_date);
                            scan_date = moment(calculated_start_date).add(1, 'day');
                            timeslot_hours = 0;
                        } else {
                            //before entering time allocation, we need to find a timeslot with time
                            //maybe we still have time in the slot from the last iteration though,
                            //in which case stay on that one
                            if (timeslot_hours <= 0) {
                                [timeslot_date, timeslot_hours] = this.findTimeslot(scan_date, resource.id);
                                scan_date = moment(timeslot_date).add(1, 'day');
                            }
                            //the task or stage start_date would then be timeslot_date
                            var calculated_start_date = moment(timeslot_date);

                            //Now walk down the timeline allocating hours from the task
                            var planned_hours = tos.PlannedHours;
                            while (planned_hours > 0) {
                                var hours_to_advance = Math.min(planned_hours, timeslot_hours);
                                planned_hours -= hours_to_advance;
                                timeslot_hours -= hours_to_advance;

                                //hours to advance is the amount of allocation, we need to add an allocation
                                setup.allocations.push(<taskallocation>{
                                    date: timeslot_date,
                                    hours: hours_to_advance
                                });
                                setup.totalallocation += hours_to_advance

                                //when we fail to exhaust hours in this timeslot, then we need a new timeslot
                                if (planned_hours != 0) {
                                    [timeslot_date, timeslot_hours] = this.findTimeslot(scan_date, resource.id);
                                    scan_date = moment(timeslot_date).add(1, 'days');
                                }
                            }
                        }

                        //scan date is always one day beyond timeslot and that's the date that we need
                        var calculated_end_date = moment(scan_date);

                        //store the new times into our objects
                        var duration = gantt.calculateDuration({ start_date: calculated_start_date.toDate(), end_date: calculated_end_date.toDate() });
                        tos.start_date = calculated_start_date.toDate();
                        tos.end_date = calculated_end_date.toDate();
                        tos.duration = duration;

                        PlanningTask_UpdateSetup(tos);

                        //finally update this resources scanpointer
                        (<any>tos).__scanpointer = <scanpointer>{
                            scan_date: moment(scan_date),
                            timeslot_date: moment(timeslot_date),
                            timeslot_hours: timeslot_hours
                        };
                        scanpointers[resource_id] = {
                            scan_date: moment(scan_date),
                            timeslot_date: moment(timeslot_date),
                            timeslot_hours: timeslot_hours
                        };
                    }

                    if (resourcetasks.length > 1) {
                        var mindate = resourcetasks.reduce((pv: Date, cv: PlanningTask) => (pv == null || cv.start_date.getTime() < pv.getTime()) ? new Date(cv.start_date) : pv, null);
                        var maxdate = resourcetasks.reduce((pv: Date, cv: PlanningTask) => (pv == null || cv.end_date.getTime() > pv.getTime()) ? new Date(cv.end_date) : pv, null);
                        
                        for (var st of resourcetasks) {
                            st.start_date = mindate;
                            st.end_date = maxdate;
                            st.duration = gantt.calculateDuration({ start_date: mindate, end_date: maxdate });

                            gantt.refreshTask(st.id, true);
                        }
                    }
                }
            }

            if (is_routed) {
                //Note: When arranging route stages, each task in turn will be book head to tail
                //which automatically puts later route stages after earlier ones, finally the
                //start/end date of each task in the stage are aligned to min/max for the whole thing

                var stageIds = planobjects.map(t => t.StageID).filter((key, idx, arr) => arr.indexOf(key) === idx);
                for (var stageId of stageIds) {
                    var stage_tasks = planobjects.filter(t => t.StageID == stageId);

                    //For each stageid, calculate the min-max date and apply to each object
                    var mindate = stage_tasks.reduce((pv: Date, cv: PlanningTask) => (pv == null || cv.start_date.getTime() < pv.getTime()) ? new Date(cv.start_date) : pv, null);
                    var maxdate = stage_tasks.reduce((pv: Date, cv: PlanningTask) => (pv == null || cv.end_date.getTime() > pv.getTime()) ? new Date(cv.end_date) : pv, null);

                    for (var st of stage_tasks) {
                        st.start_date = mindate;
                        st.end_date = maxdate;
                        st.duration = gantt.calculateDuration({ start_date: mindate, end_date: maxdate });

                        gantt.refreshTask(st.id, true);
                    }

                    //For each stageid, have the project dates recalculated
                    let tid = stage_tasks[0].id;
                    while (tid != null && tid !== gantt.config.root_id) {
                        var t = gantt.getTask(tid);
                        if (t instanceof groupmarker && t.marker_type != 'project-number') {
                            gantt.resetProjectDates(t);
                        }
                        gantt.refreshTask(tid, true);
                        tid = <string>gantt.getParent(tid);
                    }
                }
            } else {
                //update all of the plannedobjects
                for (var tos of planobjects) {
                    gantt.refreshTask(tos.id, true);

                    //scan from PO to root and recalculate all projects
                    let tid = tos.id;
                    while (tid != null && tid !== gantt.config.root_id) {
                        var t = gantt.getTask(tid);
                        if (t instanceof groupmarker && t.marker_type != 'project-number') {
                            gantt.resetProjectDates(t);
                        }
                        gantt.refreshTask(tid, true);
                        tid = <string>gantt.getParent(tid);
                    }
                }
            }

            PlannerState.ForwardPlanInProgress = false;

            //compare all planned objects to see if we are dirty
            if (PlannerState.Dirty != 'yes' && PlannerState.Dirty != 'auto-layout') {
                for (var pe of <PlanningTask[]>planobjects) {
                    if (pe.start_date.getTime() != moment(PlannerState.original[pe.id].start_date).valueOf() ||
                        pe.end_date.getTime() != moment(PlannerState.original[pe.id].end_date).valueOf()) {
                        PlannerState.Dirty = 'auto-layout';
                        break;
                    }
                }
            }
        } catch (e) {
            log.error(`Fault in ForwardPlanDocEntry: ${e.toString()}`);
        }
    }

    public static LoadGantt(IsResize: boolean) {

    var height = $(document).height() * 0.8 - 50;

    $('#gantt_here').css({ 'height': height });

    if (IsResize == true) {

        gantt.setSizes();

    } else {

        //RenderGanttChart(); // choose the way that you want to plot tha gantt's data.

    }

}
    public static Configure() {
        try {
            var self = this;
            gantt.plugins({
                grouping: true,
                tooltip: true,
                marker: true,
                overlay:true,
                auto_scheduling: false,
                keyboard_navigation: true
            });

            gantt.config.sort = true;
            gantt.config.resource_render_empty_cells = true;
            gantt.config.process_resource_assignments = false;
            gantt.config.inherit_calendar = false;

            gantt.config.date_format = "%Y-%m-%d"
            gantt.config.start_date = new Date((Math.floor((new Date()).getTime() / PlannerState.DAY_MS) - 28) * this.DAY_MS);
            gantt.config.end_date = new Date(gantt.config.start_date.getTime() + 365 * this.DAY_MS);
            gantt.config.drag_links = true;
            gantt.config.drag_project = true;
            gantt.config.details_on_dblclick = false;
            //we don't want gantt to calculate working_time, but if we turn this
            //off, the effective calendar doesn't render in the tasks pane -
            //we'll render the tasks pane calendar ourselves
            gantt.config.work_time = false;

            gantt.config.show_progress = true;

            //we want the handle visible (for clarity) so we enable dragging and make it visible in CSS
            //any attempt to drag is however ignored by the OnBeforeDrag event
            gantt.config.drag_progress = true;

            gantt.config.order_branch = false;
            gantt.config.open_tree_initially = false;
            gantt.config.auto_scheduling = true;
            //gantt.config.autosize = "xy";
            //gantt.config.autosize_min_width = 800;

            //DATA GRID
            gantt.config.columns = [
                { name: "text", tree: true, width: 200, resize: true },
                { name: "planned", label: "Hours", width: 40, align: "left", template: (obj: PlanningTask) => obj.PlannedHours, resize: true },
                { name: "start_date", width: 80, resize: true },
                { name: "POEndDate", label: "Comp Date", width: 90, template: (obj: PlanningTask) => obj.POEndDate, resize: true },
                { name: "S/O Date", label: "S/O Date", width: 90, align: "right", template: (obj: PlanningTask) => obj.SODate, resize: true },  
            ];

            gantt.templates.grid_row_class = function (start: Date, end: Date, task: PlanningTask) {
                try {
                    var css = [];
                    if (gantt.hasChild(task.id)) {
                        css.push("folder_row");
                    }

                    if (task.$virtual) {
                        css.push("group_row");
                    }
                    
                    if (task.POStatus == "R") {
                        css.push("releasedd");
                    }
                    else if (task.POStatus == "P") {
                        css.push("plannedd");
                    }


                    if (PlannerState.shouldHighlightTask(task)) {
                        css.push("highlighted_resource");
                    }

                    return css.join(" ");
                } catch (e) {
                    log.error(`Fault in gantt.templates.grid_row_class: ${e.toString()}`);
                }
            };

            gantt.templates.grid_indent = function (task: PlanningTask): string {
                return '<div style="min-width: 20px"></div>';
            };
            //addinga new layer here for sales order due date
            gantt.addTaskLayer({
                renderer: {
                    render: function draw_deadline(task: PlanningTask) {
                        var taskSODate = moment(task.SODate, "DD-MM-YYYY").toDate();
                        if (task.SODate) {
                            var el = document.createElement('div');
                            el.className = 'deadline';
                            var sizes = gantt.getTaskPosition(task, taskSODate, taskSODate);

                            el.style.left = sizes.left + 'px';
                            el.style.top = sizes.top + 'px';

                            el.setAttribute('title', gantt.templates.task_date(taskSODate));
                            return el;
                        }
                        return false;
                    },
                    // define getRectangle in order to hook layer with the smart rendering
                    getRectangle: function (task: PlanningTask) {
                        var taskvar = moment(task.SODate, "DD-MM-YYYY").toDate();
                        if (task.SODate) {
                            return gantt.getTaskPosition(task, taskvar, taskvar);
                        }
                        return null;
                    }
                }
            });
            //TASK AREA
            gantt.config.scales = [
                { unit: "month", step: 1, format: "%F, %Y" },
                { unit: "day", step: 1, format: "%j, %D" }
            ];

            //This template styles both tasks timeline and resource timeline
            gantt.templates.timeline_cell_class = function (task: PlanningTask, date: Date) {
                try {
                    if (task instanceof PlanningResource) {
                        //styles for resource view is handled by the resource pane templates
                        return '';
                    } else {
                        let classes: string[] = [];

                        //is this a group marker?
                        if (task instanceof groupmarker) {
                            classes.push(task.marker_type);
                            //to do: calendar rendering at group marker level - to do this, get sum of capacities
                            //for all resources and count of resources having zero capacities - sum == 0 - non-working
                            //else count of zeros = zero - working else partially working
                            var tasks = task.getDescendantTasks();
                            var calendar_ids = tasks.map(t => t.calendar_id).filter((key, idx, arr) => arr.indexOf(key) === idx);
                            var sum = 0;
                            var zeroes = 0;
                            for (var calid of calendar_ids) {
                                var capcachekey = `${calid}/${moment(date).format('YYYY/MM/DD')}`;
                                var cap = PlannerState.capacitycache[capcachekey];
                                sum += cap;
                                if (cap == 0) {
                                    zeroes++;
                                }
                            }
                            if (sum == 0) {
                                classes.push("column_not_working");
                            } else if (zeroes == 0) {
                                classes.push("column_normal");
                            } else {
                                classes.push("column_partial");
                            }
                        } else {
                            let calendar = gantt.getCalendar(task.$resource_id);
                            if (calendar.isWorkTime(date)) {
                                classes.push("column_normal");
                            } else {
                                classes.push("column_not_working");
                            }
                        }

                        return classes.join(' ');
                    }
                } catch (e) {
                    log.error(`Fault in gantt.templates.timeline_cell_class: ${e.toString()}`);
                }
            };

            gantt.templates.task_row_class = function (start: Date, end: Date, task: PlanningTask): string {
                //is this a group marker?
                if (task instanceof groupmarker) {
                    
                    return task.POStatus == "R" && task.marker_type == "production-order" ? "group_marker_1 released":"group_marker_1";

                }
                
                if (PlannerState.shouldHighlightTask(task)) {
                    return "highlighted_resource";
                }
                return "";
            };

            gantt.templates.task_class = function (start: Date, end: Date, task: PlanningTask) {
                let classes: string[] = []

                if (task instanceof groupmarker) {
                    classes.push(task.marker_type);
                    if (task.marker_type == "production-order") {
                        if (task.POStatus == "R") {
                            classes.push("released");
                        }
                        else if (task.POStatus == "PR") {
                            classes.push("planned");
                        }
                        
                    }
                    if (task.marker_type == "sales-order") {
                        classes.push("sales");
                    }
                }
                else {
                    if (task.POStatus == "R") {
                        classes.push("released");
                    }
                    else if (task.POStatus == "PR") {
                        classes.push("planned");
                    }
                }

                if (PlannerState.shouldHighlightTask(task)) {
                    classes.push("highlighted_resource");
                }

                return classes.join(' ');
            };

            gantt.templates.progress_text = function (start, end, task) {
                return "<span style='text-align:left;'>" + Math.round(task.progress * 100) + "% </span>";
            };

            //RESOURCE AREA
            var resourceConfig = {
                columns: [
                    {
                        name: "name", label: "Name", tree: true, resize: true, template: function (resource: PlanningResource) {
                            return resource.text;
                        }
                    },
                    {
                        name: "workload", label: "Work", align: "right", width: 100, resize: true, template: function (resource: PlanningResource) {
                            if (resource.$level == 0) {
                                var tasks;
                                var store = gantt.getDatastore(gantt.config.resource_store),
                                    field = "Resource";

                                if (store.hasChild(resource.id)) {
                                    tasks = gantt.getTaskBy(field, store.getChildren(resource.id));
                                } else {
                                    tasks = gantt.getTaskBy(field, resource.id);
                                }

                                var totalDuration = 0;
                                for (var i = 0; i < tasks.length; i++) {
                                    totalDuration += tasks[i].PlannedHours;
                                }

                                return (totalDuration || 0).toFixed(2) + "h";
                            } else if (resource.$level == 1) {
                                var tasks;
                                var store = gantt.getDatastore(gantt.config.resource_store),
                                    field = "Resource";

                                tasks = gantt.getTaskBy(field, resource.id);

                                var totalDuration = 0;
                                for (var i = 0; i < tasks.length; i++) {
                                    totalDuration += tasks[i].PlannedHours;
                                }

                                return (totalDuration || 0).toFixed(2) + "h";
                            } else if (resource.$level == 2) {
                                var task = gantt.getTask(resource.$task_id);
                                return (task.PlannedHours || 0).toFixed(2) + "h";
                            }
                        }
                    }
                ]
            };
            gantt.locale.labels.deadline_enable_button = 'Set';
            gantt.locale.labels.deadline_disable_button = 'Remove'
            gantt.locale.labels.section_owner = "Owner";

            gantt.locale.labels.section_deadline = "Deadline";
            //resources
            gantt.config.resource_store = "resource";
            gantt.config.resource_property = "owner"; // task.owner = [{ resource_id : x }]
            gantt.config.calendar_property = "calendar_id";

            //resource calendars are set during initial configuration
            gantt.setWorkTime({ day: 0, hours: true });
            gantt.setWorkTime({ day: 1, hours: true });
            gantt.setWorkTime({ day: 2, hours: true });
            gantt.setWorkTime({ day: 3, hours: true });
            gantt.setWorkTime({ day: 4, hours: true });
            gantt.setWorkTime({ day: 5, hours: true });
            gantt.setWorkTime({ day: 6, hours: true });

            var resstore = (<any>gantt).$resourcesStore;
            var cals_config: { ["owner"]: { [resource: string]: number } } = {
                "owner": {}
            };
            for (var reskey in srcapacities) {
                var caldays = [0, 1, 1, 1, 1, 1, 0];
                cals_config.owner[reskey] = gantt.addCalendar({
                    id: reskey,
                    days: caldays
                });
            }
            gantt.config.resource_calendars = cals_config;

            var resourceTemplates = {
                grid_row_class: function (start: Date | number, end: Date | number, resource: PlanningResource) {
                    var css = [];
                    if ((<any>gantt).$resourcesStore.hasChild(resource.id)) {
                        css.push("folder_row");
                        css.push("group_row");
                    }
                    if (PlannerState.shouldHighlightResource(resource)) {
                        css.push("highlighted_resource");
                    }
                    return css.join(" ");
                },
                task_row_class: function (start: Date | number, end: Date | number, resource: PlanningResource) {
                    var css = [];
                    if (PlannerState.shouldHighlightResource(resource)) {
                        css.push("highlighted_resource");
                    }
                    if ((<any>gantt).$resourcesStore.hasChild(resource.id)) {
                        css.push("group_row");
                    }

                    return css.join(" ");
                }
            };

            gantt.config.layout = {
                css: "gantt_container",
                rows: [
                    {
                        cols: [
                            { view: "grid", group: "grids", scrollY: "scrollVer" },
                            { resizer: true, width: 1 },
                            { view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer" },
                            { view: "scrollbar", id: "scrollVer", group: "vertical" }
                        ],
                        gravity: 2
                    },
                    { resizer: true, width: 1 },
                    {
                        gravity: 1,
                        id: "resources",
                        config: resourceConfig,
                        templates: resourceTemplates,
                        cols: [
                            { view: "resourceGrid", group: "grids", scrollY: "resourceVScroll" },
                            { resizer: true, width: 1 },
                            { view: "resourceHistogram", capacity: 24, scrollX: "scrollHor", scrollY: "resourceVScroll", onclick: this.histogramClicked },
                            { view: "scrollbar", id: "resourceVScroll", group: "vertical" }
                        ]
                    },
                    { view: "scrollbar", id: "scrollHor" }
                ]
            };

            //resources - https://docs.dhtmlx.com/gantt/desktop__resource_management.html
            gantt.createDatastore({
                name: gantt.config.resource_store,
                // use treeDatastore if you have hierarchical resources (e.g. workers/departments),
                type: "treeDatastore",
                fetchTasks: true,
                initItem: function (item: PlanningTask) {
                    item.parent = item.parent || gantt.config.root_id;
                    (<any>item)[gantt.config.resource_property] = item.parent;
                    item.open = /^GR-/.test(item.id);
                    return item;
                }
            });
            (<any>gantt).$resourcesStore = gantt.getDatastore(gantt.config.resource_store);

            (<any>gantt).$resourcesStore.attachEvent("onAfterSelect", function (id: string) {
                gantt.refreshData();
            });
/*            (<any>gantt).$resourcesStore.attachEvent(",
                function (id: string, resource: PlanningResource) {
                    if (PlannerState.selectionmode == 'hide-resource') {
                        return PlannerState.shouldDisplayResource(resource);
                    } else {
                        return true;
                    }
                });*/
            //onFilterItem is used to filter data store
            (<any>gantt).$resourcesStore.attachEvent("onFilterItem",
                function (id: string, resource: PlanningResource) {
                if (PlannerState.selectionmode == 'hide-resource') {
                    return PlannerState.shouldDisplayResource(resource);
                } else {
                    return true;
                }
                });
            gantt.attachEvent("onBeforeTaskDisplay", function (id: string, task: PlanningTask) {
                if (PlannerState.selectionmode == 'hide-task') {
                    return PlannerState.shouldDisplayTask(task);
                } else {
                    return true;
                }
            }, null);

            gantt.attachEvent("onBeforeLinkAdd", (id: string, item: tasklink) => {
                if (PlannerState.readonlymode && !PlannerState.ForwardPlanInProgress) {
                    return false;
                }
                return item.type == "0";
            }, null);
            gantt.attachEvent("onAfterLinkAdd", (id: string, item: tasklink) => {
                //TODO: Need some business logic controlling links to/from markers

                let task = gantt.getTask(item.source);
                let setup = PlanningTask_GetSetup(task);
                setup.links.push(item);

                PlannerState.Dirty = "yes";
            }, null);
            gantt.attachEvent("onBeforeLinkDelete", (id: string, item: tasklink) => {
                if (PlannerState.readonlymode) {
                    return false;
                }
                PlannerState.Dirty = "yes";
                return true;
            }, null);
            gantt.attachEvent("onAfterLinkDelete", (id: string, item: tasklink) => {
                let task = gantt.getTask(item.source);
                let setup = PlanningTask_GetSetup(task);
                setup.links = setup.links.filter(l => l.id != item.id);
            }, null);
            let linkupdatingsource: string = "";
            gantt.attachEvent("onBeforeLinkUpdate", (id: string, item: tasklink) => {
                if (PlannerState.readonlymode) {
                    return false;
                }
                //TODO: Need some business logic controlling links to/from markers
                linkupdatingsource = item.source;
                return item.type == "0";
            }, null);
            gantt.attachEvent("onAfterLinkUpdate", (id: string, item: tasklink) => {
                let task = gantt.getTask(linkupdatingsource);
                let setup = PlanningTask_GetSetup(task);
                setup.links = setup.links.filter(l => l.id != item.id);

                task = gantt.getTask(item.source);
                setup = PlanningTask_GetSetup(task);
                setup.links.push(item);
            }, null);

            gantt.attachEvent("onTaskOpened", function (id: string) {
                if (PlannerState.OpenedTaskIds.indexOf(id) === -1) {
                    PlannerState.OpenedTaskIds.push(id);
                }
            }, null);

            gantt.attachEvent("onTaskClosed", function (id: string) {
                var idx = PlannerState.OpenedTaskIds.indexOf(id);
                if (idx !== -1) {
                    PlannerState.OpenedTaskIds.splice(idx, 1);
                }
            }, null);

            gantt.attachEvent("onGanttReady", function () {
                gantt.ext.tooltips.tooltip.setViewport((<any>gantt).$task_data);
                

            }, null);

            gantt.attachEvent("onContextMenu", function (taskId: string, linkId: string, event: JqueryEvent) {
                log.info(`onContextMenu - taskId ${taskId} linkId ${linkId}`);

                var top = event.pageY - 10;
                var left = event.pageX - 90;

                if (taskId != null) {
                    //we have right-clicked a task bar - if it's a production-order, we have a menu for that
                    var task = gantt.getTask(taskId);
                    if (task instanceof groupmarker && task.marker_type == "production-order") {
                        $("#production-order-context-menu").css({
                            display: "block",
                            top: top,
                            left: left
                        }).addClass("show").data('taskId', taskId);
                    }
                    return false;
                }

                $("#fallback-context-menu").css({
                    display: "block",
                    top: top,
                    left: left
                }).addClass("show");
                return false;
            }, null);
            $("#production-order-context-menu").click(function (evt: JqueryEvent) {
                $("#production-order-context-menu").removeClass("show").hide();
            });
            $("#fallback-context-menu").click(function (evt: JqueryEvent) {
                $("#fallback-context-menu").removeClass("show").hide();
            });
            $(".a-forward-plan").click(function (evt: JqueryEvent) {
                var $a = $(this);
                var $menu = $a.closest('.dropdown-menu');

                var taskId = $menu.data('taskId');
                self.ForwardPlanTask(taskId);
            });
            $(".a-clear-selections").click(function (evt: JqueryEvent) {
                //unselect all the items
                let tid = gantt.getSelectedId();
                gantt.unselectTask(tid);
                gantt.getDatastore("resource").unselect();

                gantt.refreshData();
            });
            gantt.templates.histogram_cell_class = function (start_date: Date, end_date: Date, resource: PlanningResource, tasks: PlanningTask[]) {
                PlannerState.CountOfResourceCellEvents++;

                var classes: string[] = [];
                classes.push(`dt-${moment(start_date).format('YYYY-MM-DD')}`);

                if (PlannerState.BlockResourceCellEvents) {
                    classes.push("column_normal");
                }
                try {
                    if (resource.$level == 1 || resource.$level == 2) {
                        tasks = [];
                        let resource_id = "";
                        if (resource.$level == 1) {
                            gantt.eachTask((t: PlanningTask) => {
                                if (!(t instanceof groupmarker) && `${t.Resource}::${t.WhsCode}` == resource.id && moment(start_date).isBetween(t.start_date, t.end_date, undefined, '[)')) {
                                    tasks.push(t);
                                }
                            });
                            resource_id = resource.id;
                        } else {
                            tasks.push(gantt.getTask(resource.$task_id));
                            resource_id = resource.$resource_id;
                        }
                        var calendar = gantt.getCalendar(resource_id);
                        if (resource.$level == 1 && PlannerState.getAllocatedValue(tasks, resource, start_date) > PlannerState.getCapacity(start_date, resource)) {
                            if (!calendar.isWorkTime(start_date)) {
                                classes.push("column_not_working column_overload");
                            } else {
                                classes.push("column_overload");
                            }
                        } else {
                            //calendar does not seem to render for resource descriptors - do it manually
                            if (!calendar.isWorkTime(start_date)) {
                                classes.push("column_not_working");
                            } else {
                                //need to return a non-null class otherwise nothing is rendered for no-value fields
                                classes.push("column_normal");
                            }
                        }
                    } else {
                        //need to return a non-null class otherwise nothing is rendered for no-value fields
                        classes.push("column_clear");
                    }
                    return classes.join(" ");
                } catch (e) {
                    log.error(`Fault in gantt.templates.timeline_cell_class: ${e.toString()}`);
                    return "column_clear";
                }
            };
            
            gantt.templates.histogram_cell_label = function (start_date: Date, end_date: Date, resource: PlanningResource, tasks: PlanningTask[]) {
                PlannerState.CountOfResourceCellEvents++;
                if (PlannerState.BlockResourceCellEvents) {
                    return "";
                }

                try {
                    if (resource.$level == 1) {
                        if (!!(<any>gantt).$resourcesStore.hasChild(resource.id)) {
                            var capcachekey = `${resource.id}/${moment(start_date).format('YYYY/MM/DD')}`;

                            tasks = [];
                            gantt.eachTask((t: PlanningTask) => {
                                if (!(t instanceof groupmarker) && `${t.Resource}::${t.WhsCode}` == resource.id && moment(start_date).isBetween(t.start_date, t.end_date, undefined, '[)')) {
                                    tasks.push(t);
                                }
                            });
                            let allocation = PlannerState.getAllocatedValue(tasks, resource, start_date);
                            if (allocation > 0) {
                                //log.debug(`Allocation ${resource.id}/${start_date.getFullYear()}/${start_date.getMonth()}/${start_date.getDate()}: ${allocation}`);
                                return allocation.toFixed(1).replace(/\.0+$/, '');
                            } else {
                                //log.debug(`Allocation ${resource.id}/${start_date.getFullYear()}/${start_date.getMonth()}/${start_date.getDate()}: ${allocation}`);
                                return '';
                            }
                        } else {
                            return '';
                        }
                    } else if (resource.$level == 0) {
                        return "";
                    } else if (resource.$level == 2) {
                        //single task allocated value
                        let allocation = PlannerState.getAllocatedValueForTaskResource(resource, start_date);
                        if (allocation > 0) {
                            return allocation.toFixed(1).replace(/\.0+$/, '');
                        } else {
                            return '';
                        }
                    }
                    log.warn(`Allocation - Should not be here.`);
                } catch (e) {
                    log.error(`Fault in gantt.templates.timeline_cell_class: ${e.toString()}`);
                    return '';
                }
            };

            gantt.templates.histogram_cell_allocated = function (start_date: Date, end_date: Date, resource: PlanningResource, tasks: PlanningTask[]) {
                PlannerState.CountOfResourceCellEvents++;
                if (PlannerState.BlockResourceCellEvents) {
                    return 0;
                }

                if (resource.$level == 1) {
                    tasks = [];
                    gantt.eachTask((t: PlanningTask) => {
                        if (!(t instanceof groupmarker) && `${t.Resource}::${t.WhsCode}` == resource.id && moment(start_date).isBetween(t.start_date, t.end_date, undefined, '[)')) {
                            tasks.push(t);
                        }
                    });
                    return PlannerState.getAllocatedValue(tasks, resource, start_date);
                } else {
                    return 0;
                }
            };

            gantt.templates.histogram_cell_capacity = function (start_date: Date, end_date: Date, resource: PlanningResource, tasks: PlanningTask[]) {
                PlannerState.CountOfResourceCellEvents++;
                if (PlannerState.BlockResourceCellEvents) {
                    return 0;
                }

                if (resource.$level == 1) {
                    let capacity = PlannerState.getCapacity(start_date, resource) ?? 0;
                    //log.debug(`Capacity ${resource.id}/${start_date.getFullYear()}/${start_date.getMonth()}/${start_date.getDate()}: ${capacity}`);
                    return capacity;
                } else {
                    return 0;
                }
            };
            gantt.templates.tooltip_text = function (start: Date, end: Date, task: PlanningTask) {
                return "<b>ItemCode:</b> " + task.id + "<br/><b>Item Description:</b> " + task.text + "<br/><b>Required Hours:</b> " + task.PlannedHours + "<br/><b>Booked Hours:</b> " + task.IssuedQuantity + "<br/><b>Booked Qty:</b> " + task.BookedQuantity + "<br/><b>OP Description:</b> " + task.OpDescription + "<br/><b>Status:</b> " + task.status + "<br/><b>NCR Number:</b> " + "*not available*" + "<br/><b>Sales Order Due Date:</b> " + task.SODate + "<br/>";
            };
            gantt.ext.tooltips.detach(".gantt_grid .gantt_grid_data .gantt_row .gantt_row_project");
            gantt.ext.tooltips.tooltipFor({
                selector: ".gantt_grid .gantt_grid_data .gantt_row.gantt_row_project",
                html: (onmouseenter: MouseEvent) => {
                    try {
                        const targetTaskId = gantt.locate(event);
                        if (gantt.isTaskExists(targetTaskId)) {
                            var task = gantt.getTask(targetTaskId);
                            var marker = task.marker_type;
                            var totalhours = 0;
                            let porders: Array<string> = [];
                            let finallist: Array<PlanningTask> = [];
                            var getter3: Array<string> = [];
                            let listOfHours: Array<string> = [];
                            let listOfIssuedQty: Array<string> = [];
                            var straightStream: boolean = false;
                            var getter1 = gantt.getTaskByTime(task.start_date, task.end_date);

                            //filtering production orders matching on sales order
                            var getter2 = getter1.filter(function (el) {
                                return el.$rendered_parent == task.id
                            });
                            //we get the distinct names of all production orders
                            //type---sales>prod>tasks
                            if (task.$rendered_parent == 0) {
                                if (task.marker_type == "sales-order") {
                                    for (let i = 0; i < getter2.length; i++) {
                                        porders.push(getter2[i].id);
                                    }
                                }
                                else {
                                    for (let i = 0; i < getter2.length; i++) {
                                        porders.push(getter2[i].$rendered_parent);
                                    }
                                }
                            }
                            //if the order of group by is production order>sales order.
                            if (getter2[0].marker_type == "sales-order") {
                                //extract the names of all production orders related to that sales order
                                for (var i = 0; i < getter2.length; i++) {
                                    if (getter2[i].marker_type == "sales-order") {
                                        getter3.push(getter2[i].id);
                                    }
                                }
                                //extract the list of tasks in that sales order
                                finallist = getter1.filter((el) => {
                                    return getter3.some((f) => {
                                        return f === el.$rendered_parent;
                                    });
                                });
                                straightStream = true;

                            }
                            else if (getter2[0].marker_type == "production-order") {
                                for (var i = 0; i < getter2.length; i++) {
                                    if (getter2[i].marker_type == "production-order") {
                                        getter3.push(getter2[i].id);
                                    }
                                }
                                //extract the list of tasks in that sales order
                                finallist = getter1.filter((el) => {
                                    return getter3.some((f) => {
                                        return f === el.$rendered_parent;
                                    });
                                });
                                straightStream = true;
                            }
                            else if (getter2[0].$rendered_type == "task"){
                                finallist = getter2;
                                straightStream = true;
                            }
                            
                            if (task.marker_type == "sales-order" && straightStream == false) {
                                //here we filter once more to finally get all the tasks finally from the main list
                                finallist = getter1.filter((el) => {
                                    return porders.some((f) => {
                                        return  f === el.$rendered_parent;
                                    });
                                });



                            }

                            else if (task.marker_type == "production-order" && straightStream == false) {
                                finallist = getter2;
                            }

                            

                            //extract the number of hours from each array
                            for (let k = 0; k < finallist.length; k++) {
                                listOfHours.push(parseFloat(finallist[k].PlannedHours.toString()).toString());
                                listOfIssuedQty.push(parseFloat(finallist[k].IssuedQuantity.toString()).toString());
                            }
                            //const sum = list.reduce((acc, value) => acc + value, 0);

                            //sum up the numbers
                            var result = (listOfHours
                                .map(function (i) { // assure the value can be converted into an integer
                                    return /^\d+(\.\d+)?$/.test(i) ? parseFloat(i) : 0;
                                })
                                .reduce((acc, value) => acc + value, 0)).toFixed(2);
                            var hrsSum2 = result;

                            var result2 = (listOfIssuedQty
                                .map(function (i) { // assure the value can be converted into an integer
                                    return /^\d+(\.\d+)?$/.test(i) ? parseFloat(i) : 0;
                                })
                                .reduce((acc, value) => acc + value, 0)).toFixed(4);
                            var issuedSum2 = result2;



                            return "<b>ItemCode:</b> " + task.id + "<br/><b>Item Description:</b> " + task.text + "<br/><b>Total Hours:</b> " + hrsSum2 + "<br/><b>Total Issued:</b> " + issuedSum2;

                        }
                        return null;
                    }
                    catch (e) {
                        console.log(e);
                    }
                },
                global: true
            });

            
        } catch (e) {
            log.error(`Fault in Configure: ${e.toString()}`);
        }
    }
    public static async LoadFlatTasks(criteria: PlannerSearchCriteria): Promise<any> {
        try {
            $('#confirm_dialog3').show();
            var counter = 0;
            
            var jcriteria = JSON.stringify(criteria,
                function (this: any, key: string, value: any) {
                    if (key == "datestart" || key == "dateend") {
                        if (/^\s*$/.test(value)) {
                            return null;
                        } else {
                            return moment.utc(value, "DD/MM/YYYY").toISOString();
                        }
                    }
                    return value;
                }
            );
            
            let pflatdata: Promise<Response>;
            pflatdata = fetch("/api/data/flat-task-data", {
                method: "POST",
                body: jcriteria,
                headers: [["Content-Type", "application/json"]]})

            let presources: Promise<Response>;
            presources = fetch("/api/data/resources");

            //fetch a list of keys that were expanded in the current data
            let ExpandedTasks: string[] = [];


            let dataresponse: Response = await pflatdata;
            if (dataresponse.status == 401) {
                throw new NotAuthorisedError("NotAuthorisedError: Flat Task Data Load");
            }
            let permission = dataresponse.headers.get("x-wpp-permission");
            PlannerState.usercanedit = (permission.toUpperCase() == "FULL");

            let data: PlannerFlatData = await dataresponse.json();
            log.info("*=> Task Data - Downloaded");
            PlannerUI.incrementLoadingIndicator(1);
            let dataTemp = $("#dom").data(data.tasks);

            let rawresources: any = await (await presources).json();
            log.info("*=> Resource Data - Downloaded");
            PlannerUI.incrementLoadingIndicator(2);

            (<any>gantt).$data.tasksStore.clearAll();
            (<any>gantt).$data.linksStore.clearAll();

            //make real dates (where gantt doesn't do it for us)
            if (data.timelinestart != null) {
                data.timelinestart = new Date(Date.parse(<any>data.timelineend as string));
            }
            if (data.timelineend != null) {
                data.timelineend = new Date(Date.parse(<any>data.timelineend as string));
            }

            for (var ic of data.internalcapacities) {
                if (ic.CapDate != null) {
                    ic.CapDate = new Date(Date.parse(<any>ic.CapDate as string));
                }
            }

            data.links = [];
            for (var t of data.tasks) {
                //make fake owner properties
                t.owner = [{ "resource_id": `${t.Resource}::${t.WhsCode}`, "value": t.PlannedHours }];
                t.calendar_id = `${t.Resource}::${t.WhsCode}`;
                //make real dates (where gantt doesn't do it for us)
                if (t.ProjectStartDate != null) {
                    t.ProjectStartDate = new Date(Date.parse(<any>t.ProjectStartDate as string));
                }
                if (t.ProjectEndDate != null) {
                    t.ProjectEndDate = new Date(Date.parse(<any>t.ProjectEndDate as string));
                }
                if (t.ActivityStartDate != null) {
                    t.ActivityStartDate = new Date(Date.parse(<any>t.ActivityStartDate as string));
                }
                if (t.ActivityEndDate != null) {
                    t.ActivityEndDate = new Date(Date.parse(<any>t.ActivityEndDate as string));
                }
                //we only create links if the item was previously saved and has links to create
                if (t.WPPSaved) {
                    var setup = PlanningTask_GetSetup(t);
                    if (setup.links != null && setup.links.length != 0) {
                        for (var l of setup.links) {
                            //log.info(`Adding link from ${prevtask.id} to ${t.id}`);
                            data.links.push({
                                id: l.id,
                                source: l.source,
                                target: l.target,
                                type: l.type
                            });
                        }
                    }
                }
            }

            PlannerState.DeserializeBaseline(data.baselinetasks);
            PlannerState.Dirty = 'no';

            //Resources Layout
            //Get used Resource and WhsCode combos from onscreen tasks
            var resource_codes = data.tasks.map(t => `${t.Resource}::${t.WhsCode}`).filter((key, idx, arr) => arr.indexOf(key) === idx).sort();

            //get the layout of resources and departments
            var resourcelayout: PlanningResource[] = rawresources.people.map((p: any) => {
                var typedp = new PlanningResource();
                return Object.assign(typedp, p);
            });

            //spread resources that appear in multiple warehouses
            var finallayout: PlanningResource[] = [];
            for (var layoutobj of resourcelayout) {
                if (/^GR-/.test(layoutobj.id)) {
                    //groups just get pushed as-is
                    finallayout.push(layoutobj);
                } else {
                    var mycodes = resource_codes.filter(rc => rc.indexOf(`${layoutobj.id}::`) == 0);
                    if (mycodes.length == 1) {
                        //if there's a single warehouse, we need to change the id, but not the label
                        layoutobj.id = mycodes[0];
                        finallayout.push(layoutobj);
                    } else {
                        for (var code of mycodes) {
                            var WhsCode = /::(.*)$/.exec(code)[1];

                            var newresource = Object.assign(new PlanningResource(), layoutobj);
                            newresource.id = code;
                            newresource.text += `/${WhsCode}`;
                            finallayout.push(newresource);
                        }
                    }
                }
            }

            (<any>gantt).$resourcesStore.parse(finallayout);
            PlannerUI.incrementLoadingIndicator(3);

            //Load the capacities into the PlannerState and translate the
            //workingTime into the calendar
            for (var reskey of resource_codes) {
                var calendar = gantt.getCalendar(reskey);
                if (calendar == null) {
                    gantt.addCalendar({
                        id: reskey
                    });
                    calendar = gantt.getCalendar(reskey);
                }

                var resourcedates = data.internalcapacities.filter(r => `${r.ResCode}::${r.WhsCode}` == reskey);
                //each date in our range should return a capacity, if there isn't a figure in our
                //resourcedates data, then it's zero
                var scan = new Date(gantt.config.start_date);

                while (resourcedates.length != 0 && moment(resourcedates[0].CapDate).format("YYYYMMDD") < moment(scan).format("YYYYMMDD")) {
                    resourcedates.shift();
                }

                while (scan <= gantt.config.end_date) {
                    let cap = 0;
                    while (resourcedates.length != 0 && moment(resourcedates[0].CapDate).format("YYYYMMDD") == moment(scan).format("YYYYMMDD")) {
                        var rd = resourcedates.shift();
                        cap += rd.SngRunCap;
                    }
                    calendar.setWorkTime({ date: scan, hours: cap == 0 ? false : true });

                    var capcachekey = `${reskey}/${moment(scan).format('YYYY/MM/DD')}`;
                    PlannerState.capacitycache[capcachekey] = cap;

                    scan = new Date(scan.getTime() + PlannerState.DAY_MS);
                }
            }

            PlannerUI.incrementLoadingIndicator(4);

            await PlannerUI.InitGui();
            $('#ResetFiltersbtn').click();
            //counter = counter + 1;
            //$('#counter01').text(counter.toString());
            
            PlannerUI.incrementLoadingIndicator(5);
            //$("#dpbutton").click();

            await PlannerUI.InvokeGroupBy(data.tasks);
            gantt.parse({ tasks: [], links: data.links });

            //add the data to the 'original' hash
            for (var task of data.tasks) {
                var tobj = Object.assign({}, task);
                PlannerState.original[tobj.id] = tobj;
            }

            //When the layout as seen on the planner was not previously saved
            //then we ForwardPlan the tasks - in this way every task is generally
            //rendered with it's tasks spread out. The user can then edit as they
            //wish
            let count = 0;
            for (let pe of <PlanningTask[]>data.tasks.filter(t => (t instanceof groupmarker) && t.marker_type == 'production-order' && !t.WPPSaved)) {
                await PlannerState.ForwardPlanTask(pe.id);
                //stop browser timeout during this process
                count++;
                if (count % 20 == 0) {
                    await $.Deferred().resolve({ status: "OK" }).promise();
                }
            }

            //Open any branches that we have in our list
            for (let openid of PlannerState.OpenedTaskIds) {
                gantt.open(openid);
            }

            gantt.render();

            $('#confirm_dialog3').hide();
        } catch (e) {
            log.error(`Fault in LoadFlatTask: ${e.toString()}`);
            throw e;
        }
    }

    public static BeforeTaskDrag(id: string, mode: string) {
        if (PlannerState.readonlymode) {
            return false;
        } else if (mode == 'progress') {
            return false;
        } else {
            this.IndicateProjectRange(id);
            return true;
        }
    }

    public static eachSuccessor(callback: (task: PlanningTask) => void, root: string, alreadyTravered?: boolean) {
        if (!gantt.isTaskExists(root))
            return;

        // remember tasks we've already iterated in order to avoid infinite loops
        var traversedTasks = arguments[2] || {};
        if (traversedTasks[root])
            return;
        traversedTasks[root] = true;

        var rootTask = gantt.getTask(root);
        var links = rootTask.$source;
        if (links) {
            for (var i = 0; i < links.length; i++) {
                var link = gantt.getLink(links[i]);
                if (gantt.isTaskExists(link.target) && !traversedTasks[link.target]) {
                    callback.call(gantt, gantt.getTask(link.target));

                    // iterate the whole branch, not only first-level dependencies
                    this.eachSuccessor(callback, link.target, traversedTasks);
                }
            }
        }
    };

    public static TaskDrag(id: string, mode: string, task: PlanningTask, original: PlanningTask, e:JqueryEvent) {
        try {
            var modes = gantt.config.drag_mode;
            if (mode == modes.move || mode == modes.resize) {
                var orglen = original.end_date.getTime() - original.start_date.getTime();
                var tlen = task.end_date.getTime() - task.start_date.getTime();
                var diff = task.start_date.getTime() - original.start_date.getTime() + tlen - orglen;
                PlannerState.eachSuccessor((child: PlanningTask) => {
                    child.start_date = new Date(child.start_date.getTime() + diff);
                    child.end_date = new Date(child.end_date.getTime() + diff);
                    gantt.refreshTask(child.id, true);
                }, id);
            }
            return true;
        } catch (e) {
            log.error(`Fault in TaskDrag: ${e.toString()}`);
            return false;
        }
    }

    public static PropogateProjectDates(id: string, start_date: Date, end_date: Date) {
        var t = gantt.getTask(id);
        t.ProjectStartDate = start_date;
        t.ProjectEndDate = end_date;
        var acid = gantt.getChildren(id);
        for (var cid of acid) {
            this.PropogateProjectDates(cid, start_date, end_date);
        }
    }

    public static AfterTaskDrag(id: string, mode: string, e: JqueryEvent) {
        try {
        //Rounding
        var modes = gantt.config.drag_mode;
        if (mode == modes.move || mode == modes.resize) {
            PlannerState.eachSuccessor(function (child) {

                //any task updated would be switched to mean mode
                let setup = PlanningTask_GetSetup(child);
                setup.planning = 'mean';
                setup.allocations = [];
                setup.totalallocation = 0;

                child.start_date = gantt.roundDate(child.start_date);
                child.end_date = gantt.calculateEndDate({ start_date: child.start_date, duration: child.duration });
                gantt.updateTask(child.id, child);
            }, id);
        }

        //if we're dragging a task that has a StageID - also drag sibling tasks
        //recognise task by likely looking ID
        var original = gantt.getTask(id);

        let setup = PlanningTask_GetSetup(original);
        setup.planning = 'mean';
        setup.allocations = [];
        setup.totalallocation = 0;

        //project clipping
        var clipped = false;
        if (original instanceof groupmarker) {
            //project group markers should not be adjusted such that existing children do not fit
            if (original.marker_type == 'project-number') {
                var children = gantt.getChildren(original.id).map((c: number) => gantt.getTask(c));
                //move start date back first
                for (var c of children) {
                    if (c.start_date < original.start_date) {
                        clipped = true;
                        original.start_date = c.start_date;
                    }
                }
                //now move end date forward
                for (var c of children) {
                    if (c.end_date > original.end_date) {
                        clipped = true;
                        original.end_date = c.end_date;
                    }
                }

                //finally move start date back 1 day if start and end result in being the same date
                if (Number(original.end_date) - Number(original.start_date) < this.DAY_MS) {
                    original.start_date = new Date(Number(original.end_date) - this.DAY_MS);
                    clipped = true;
                }
                //now reset the duration
                original.duration = gantt.calculateDuration(original);

                this.PropogateProjectDates(original.id, original.start_date, original.end_date);
                if (clipped) {
                    $('#warning-message').text(`The project dates have been adjusted to accommodate existing tasks: ${moment(original.start_date).format('DD/MM/YYYY')} - ${moment(original.end_date).format('DD/MM/YYYY')}`);
                    $('#warning-modal').modal();
                }
            }
        } else {
            //tasks can be dragged outside of the designated project
            if (original.ProjectStartDate != null && original.ProjectStartDate > original.start_date) {
                original.start_date = original.ProjectStartDate;
                clipped = true;
            }
            //move end date forward 1 day if start and end result in being the same date
            if (Number(original.end_date) - Number(original.start_date) < this.DAY_MS) {
                original.end_date = new Date(Number(original.start_date) + this.DAY_MS);
                clipped = true;
            }
            if (original.ProjectEndDate != null && original.ProjectEndDate < original.end_date) {
                original.end_date = original.ProjectEndDate;
                clipped = true;
            }
            //finally move start date back 1 day if start and end result in being the same date
            if (Number(original.end_date) - Number(original.start_date) < this.DAY_MS) {
                original.start_date = new Date(Number(original.end_date) - this.DAY_MS);
                clipped = true;
            }

            //Also possible to drag outside of current Activity (IA Project Data)
            var activity_clip = false;
            if (original.ActivityStartDate != null && original.ActivityStartDate > original.start_date) {
                original.start_date = original.ActivityStartDate;
                clipped = true;
                activity_clip = true;
            }
            //move end date forward 1 day if start and end result in being the same date
            if (Number(original.end_date) - Number(original.start_date) < this.DAY_MS) {
                original.end_date = new Date(Number(original.start_date) + this.DAY_MS);
                clipped = true;
                activity_clip = true;
            }
            if (original.ActivityEndDate != null && original.ActivityEndDate < original.end_date) {
                original.end_date = original.ActivityEndDate;
                clipped = true;
                activity_clip = true;
            }
            //finally move start date back 1 day if start and end result in being the same date
            if (Number(original.end_date) - Number(original.start_date) < this.DAY_MS) {
                original.start_date = new Date(Number(original.end_date) - this.DAY_MS);
                clipped = true;
                activity_clip = true;
            }

            //now reset the duration
            original.duration = gantt.calculateDuration(original);

            if (clipped) {
                if (activity_clip) {
                    $('#warning-message').text(`The task dates have been adjusted to accommodate the activity dates: ${moment(original.start_date).format('DD/MM/YYYY')} - ${moment(original.end_date).format('DD/MM/YYYY')}`);
                } else {
                    $('#warning-message').text(`The task dates have been adjusted to accommodate the project dates: ${moment(original.start_date).format('DD/MM/YYYY')} - ${moment(original.end_date).format('DD/MM/YYYY')}`);
                }
                $('#warning-modal').modal();
            }
        }

        if (original.StageID != null && /^\d+\/\d+$/.test(original.id)) {
            var prefix = (original.id as string).substr(0, (original.id as string).indexOf('/'));
            var siblings : PlanningTask[] = [];
            gantt.eachTask((t:PlanningTask) => {
                if (t.id != original.id && t.StageID == original.StageID && t.id.indexOf(prefix) === 0 && /^\d+\/\d+$/.test(t.id)) {
                    siblings.push(t);
                }
            });
            var changeany = false;
            for (var s of siblings) {
                //if an item had siblings, cause the post-clip refresh to fire
                clipped = true;
                if (s.start_date != original.start_date ||
                    s.duration != original.duration ||
                    s.end_date != original.end_date
                ) {
                    s.start_date = original.start_date;
                    s.duration = original.duration;
                    s.end_date = original.end_date;
                    gantt.refreshTask(s.id, true);
                    changeany = true;
                }
            }
        }

        if (clipped) {
            //refresh each task up to the ultimate parent (when displayed)
            var tid = original.id;
            while (tid != null && tid !== gantt.config.root_id) {
                var t = gantt.getTask(tid);
                if (t instanceof groupmarker && t.marker_type != 'project-number') {
                    gantt.resetProjectDates(t);
                }
                gantt.refreshTask(tid, true);
                tid = gantt.getParent(tid);
            }
        }

        this.IndicateProjectRange(gantt.getSelectedId());

        if (!(original instanceof groupmarker)) {
            var t1 = original;
            var t2 = PlannerState.original[t1.id];

            if (t1.start_date != t2.start_date || t1.end_date != t2.end_date) {
                //a movement that ends up in a changed date makes the planner dirty
                PlannerState.Dirty = 'yes';
            }
            //to do: a movement that back to initial position could end up with a clean board
        }

            return true;
        } catch (e) {
            log.error(`Fault in AfterTaskDrag: ${e.toString()}`);
            return false;
        }
    }

    public static PrjStartMarkerId : string = null;
    public static PrjEndMarkerId : string = null;
    public static ActStartMarkerId: string = null;
    public static ActEndMarkerId: string = null;
    public static IndicateProjectRange(id: string) {
        try {
            var task = (id == null ? null : gantt.getTask(id));

            //if we're on a group marker, we'll need to descend to an actual task
            while (task != null && (task instanceof groupmarker)) {
                var tasks = gantt.getChildren(task.id);
                if (tasks != null) {
                    task = (tasks.length == 0) ? null : gantt.getTask(tasks[0]);
                } else {
                    task = null;
                }
            }
            if (task == null || task.ProjectStartDate == null) {
                if (this.PrjStartMarkerId != null) {
                    gantt.deleteMarker(this.PrjStartMarkerId);
                    this.PrjStartMarkerId = null;
                }
            }
            else {
                var dateToStr = gantt.date.date_to_str(gantt.config.task_date);
                if (this.PrjStartMarkerId == null) {
                    this.PrjStartMarkerId = gantt.addMarker({
                        start_date: task.ProjectStartDate,
                        css: 'project_start_marker',
                        text: 'Start',
                        title: `${task.Project}: ${dateToStr(task.ProjectStartDate)}`
                    });
                } else {
                    var mrk = gantt.getMarker(this.PrjStartMarkerId);
                    mrk.start_date = task.ProjectStartDate;
                    mrk.title = `${task.Project}: ${dateToStr(task.ProjectStartDate)}`;
                    gantt.updateMarker(this.PrjStartMarkerId);
                }
            }

            if (task == null || task.ProjectEndDate == null) {
                if (this.PrjEndMarkerId != null) {
                    gantt.deleteMarker(this.PrjEndMarkerId);
                    this.PrjEndMarkerId = null;
                }
            } else {
                var dateToStr = gantt.date.date_to_str(gantt.config.task_date);
                if (this.PrjEndMarkerId == null) {
                    this.PrjEndMarkerId = gantt.addMarker({
                        start_date: task.ProjectEndDate,
                        css: 'project_end_marker',
                        text: 'End',
                        title: `${task.Project}: ${dateToStr(task.ProjectEndDate)}`
                    });
                } else {
                    var mrk = gantt.getMarker(this.PrjEndMarkerId);
                    mrk.start_date = task.ProjectEndDate;
                    mrk.title = `${task.Project}: ${dateToStr(task.ProjectEndDate)}`;
                    gantt.updateMarker(this.PrjEndMarkerId);
                }
            }
        } catch (e) {
            log.error(`Fault in IndicateProjectRange: ${e.toString()}`);
        }
    }

    public static IndicateActivityRange(id: string) {
        try {
            var task = (id == null ? null : gantt.getTask(id));

            //if we're on a group marker, we'll need to descend to an actual task
            while (task != null && (task instanceof groupmarker)) {
                var tasks = gantt.getChildren(task.id);
                if (tasks != null) {
                    task = (tasks.length == 0) ? null : gantt.getTask(tasks[0]);
                } else {
                    task = null;
                }
            }
            if (task == null || task.ActivityStartDate == null) {
                if (this.ActStartMarkerId != null) {
                    gantt.deleteMarker(this.ActStartMarkerId);
                    this.ActStartMarkerId = null;
                }
            }
            else {
                var dateToStr = gantt.date.date_to_str(gantt.config.task_date);
                if (this.ActStartMarkerId == null) {
                    this.ActStartMarkerId = gantt.addMarker({
                        start_date: task.ActivityStartDate,
                        css: 'activty_start_marker',
                        text: 'Start',
                        title: `${task.Activity}: ${dateToStr(task.ActivityStartDate)}`
                    });
                } else {
                    var mrk = gantt.getMarker(this.ActStartMarkerId);
                    mrk.start_date = task.ActivityStartDate;
                    mrk.title = `${task.Activity}: ${dateToStr(task.ActivityStartDate)}`;
                    gantt.updateMarker(this.ActStartMarkerId);
                }
            }

            if (task == null || task.ActivityEndDate == null) {
                if (this.ActEndMarkerId != null) {
                    gantt.deleteMarker(this.ActEndMarkerId);
                    this.ActEndMarkerId = null;
                }
            } else {
                var dateToStr = gantt.date.date_to_str(gantt.config.task_date);
                if (this.ActEndMarkerId == null) {
                    this.ActEndMarkerId = gantt.addMarker({
                        start_date: task.ActivityEndDate,
                        css: 'activity_end_marker',
                        text: 'End',
                        title: `${task.Activity}: ${dateToStr(task.ActivityEndDate)}`
                    });
                } else {
                    var mrk = gantt.getMarker(this.ActEndMarkerId);
                    mrk.start_date = task.ActivityEndDate;
                    mrk.title = `${task.Activity}: ${dateToStr(task.ActivityEndDate)}`;
                    gantt.updateMarker(this.ActEndMarkerId);
                }
            }
        } catch (e) {
            log.error(`Fault in IndicateActivityRange: ${e.toString()}`);
        }
    }

    public static TaskSelected(id: string) {
        this.IndicateProjectRange(id);
        this.IndicateActivityRange(id);
    }

    public static async Initialise() {
        let self = this;
        try {
            PlannerState.Configure();

            gantt.init("gantt_here");

/*            gantt.attachEvent("onEmptyClick", function (task: PlanningTask) {
                var target = $(this);
                console.log(target[0].className);
                var cell = target.closest(".gantt_histogram_cell");
                if (cell.length > 0) {
                    var date = /dt-(\d{4})-(\d{2})-(\d{2})/.exec(cell[0].className);
                    console.log(`Resource Cell Click: Value: ${$('.gantt_histogram_label', cell).text()} Resource: ${cell.data('resource-id')} Date: ${date[3]}/${date[2]}/${date[1]}`);
                }
            }, null);
            gantt.attachEvent("onEmptyClick", function (task: PlanningTask) {
                var target = $(event.target);
                var t2 = target[0].offsetParent.attributes;
                var jj = "";
                var element = $(event.target);
                $(element[0].offsetParent.attributes).each(function () {
                    if (this.nodeName == 'data-resource-id') {
                        jj = this.nodeValue;
                    }
                });//t2.getNamedItem("data-resource-id").nodeValue;
                //let actual_resource: PlanningResource = (<any>gantt).$resourcesStore.getItem(t3);

                if (target[0].className == ("gantt_histogram_label")) {

                    if (PlannerState.selectionmode == 'hide-task') {

                        $('div[data-resource-id="' + jj + '"][role="row"]').click();
                    }

                }
            }, null);*/
           // $('#gantt_here').on('click', '.gantt_histogram_label', function (task: PlanningTask) {});
            gantt.attachEvent("onEmptyClick", function (task: PlanningTask) {
                var counter = 0;
                var target = $(event.target);
                if (target[0].className === "gantt_histogram_label") { }
                else {
                   // $('#resDate').text = '';
                }
            }, null);

            $('#gantt_here').on('click', '.gantt_histogram_label', function (task: PlanningTask) {

                    var target = $(this);
                //console.log(target[0].className);
                var jj = PlannerState.selectionmode;
                    var element = $(event.target);
                    $(element[0].offsetParent.attributes).each(function () {
                        if (this.nodeName === 'data-resource-id') {
                            jj = this.nodeValue;
                        }
                    });
                    var cell = target.closest(".gantt_histogram_cell");
                    if (cell.length > 0) {
                        var date = /dt-(\d{4})-(\d{2})-(\d{2})/.exec(cell[0].className);
                        //console.log(`Resource Cell Click: Value: ${$('.gantt_histogram_label', cell).text()} Resource: ${cell.data('resource-id')} Date: ${date[3]}/${date[2]}/${date[1]}`);
                        var tipcontent = PlannerState.getResourceCellComponents(cell.data('resource-id'), moment(`${date[1]}-${date[2]}-${date[3]}`));
                        //$('#resDate').text = '';
                        $('#resDate').text(`${date[1]}-${date[2]}-${date[3]}`);
                        $('div[data-resource-id="' + jj + '"][role="row"]').click();
                        $('#resDate').text('');
                    }  
            });

            let syncf_tooltip = new ejs.popups.Tooltip({
                content: 'A TOOLTIP!',
                target: 'gantt_histogram_label',
                animation: { open: { effect: 'None' }, close: { effect: 'None' } }
            }, '.gantt_data_area');

            $('#gantt_here').on('mouseenter', '.gantt_histogram_label', function (task: PlanningTask) {
                var target = $(this);
                if (target[0].className == "gantt_histogram_label") {
                //console.log(target[0].className);
                var cell = target.closest(".gantt_histogram_cell");
                if (cell.length > 0) {
                    var date = /dt-(\d{4})-(\d{2})-(\d{2})/.exec(cell[0].className);
                    //console.log(`Resource Cell Click: Value: ${$('.gantt_histogram_label', cell).text()} Resource: ${cell.data('resource-id')} Date: ${date[3]}/${date[2]}/${date[1]}`);
                    var tipcontent = PlannerState.getResourceCellComponents(cell.data('resource-id'), moment(`${date[1]}-${date[2]}-${date[3]}`));
                    if (tipcontent != '') {
                        syncf_tooltip.content = tipcontent;
                        syncf_tooltip.open(cell[0]);
                    }
                }
            }
            });
            $('#gantt_here').on('mouseleave', '.gantt_histogram_label', function (task: PlanningTask) {
                var target = $(this);
                console.log(target[0].className);
                var cell = target.closest(".gantt_histogram_cell");
                if (cell.length > 0) {
                    syncf_tooltip.close();
                }
            });
            gantt.attachEvent("onTaskLoading", function (task: PlanningTask) {
                if (task.SODate) {
                    task.SODate = moment(task.SODate, "DD-MM-YYYY").toDate();
                }
                return true;
            }, null);


            gantt.attachEvent("onTaskDblClick", function (task) {
                var gg = gantt.getTask(task);
                gg.$open = true;
                var g2 = gantt.getChildren(task);
                var g4 = g2.length;
                for (var i = 0; i < g4; i++) {
                    var g3 = gantt.getTask(g2[i]);
                    g3.$open = true;
                    gantt.render();
                }

            }, null);


            gantt.attachEvent("onRowDragStart", (id: string, target: PlanningTask, e: JqueryEvent) => false, undefined);
            gantt.attachEvent("onBeforeTaskDrag", (id: string, mode: string) => PlannerState.BeforeTaskDrag(id, mode), undefined);
            gantt.attachEvent("onTaskDrag", (id: string, mode: string, task: PlanningTask, original: PlanningTask, e: JqueryEvent) => PlannerState.TaskDrag(id, mode, task, original, e), undefined);
            gantt.attachEvent("onAfterTaskDrag", (id: string, mode: string, e: JqueryEvent) => PlannerState.AfterTaskDrag(id, mode, e), undefined);
            gantt.attachEvent("onTaskSelected", (id: string) => PlannerState.TaskSelected(id), undefined);

            (<any>gantt).$resourcesStore.attachEvent("onParse", function () {
                var people: PlanningResource[] = [];

                (<any>gantt).$resourcesStore.eachItem(function (res: PlanningResource) {
                    if (!(<any>gantt).$resourcesStore.hasChild(res.id)) {
                        var copy = gantt.copy(res);
                        copy.key = res.id;
                        copy.label = res.text;
                        people.push(copy);
                    }
                });
                gantt.updateCollection("people", people);
            });

            log.info("Downloading data...");
            $('#confirm_dialog2').show();
            PlannerUI.startLoadingModal(4);

            PlannerState.usercanedit = false;
            PlannerState.readonlymode = false;

            //Tasks
            await PlannerUI.OnUpdateQueryClick(null);
            $('#confirm_dialog2').hide();
        } catch (e) {
            if (e instanceof NotAuthorisedError) {
                log.info('NotAuthorisedError detected, starting login dialog.');

                //Loading failed, need to remove the loading popup
                PlannerUI.hideLoadingModal();
                //$('#confirm_dialog2').hide();
                //now run the login
                PlannerUI.LoginDialog(() => { PlannerState.Initialise(); });
                $('#confirm_dialog3').hide();
                //$('#confirm_dialogg').show();
                document.getElementById('mBody').style.display = "none";
                document.getElementById("loginbox").style.display = "block";
            } else { 
                log.error(`Fault in Initialise: ${e.toString()}`);
            }
        }
    }
 
    public static generateDeferredPromise() {
        let resolve: any = null;
        let reject: any = null;
        const promise = new Promise((res, rej) => {
            [resolve, reject] = [res, rej];
        });
        return { promise, reject, resolve };
    }

    private static prodorderstosave: prodord = {};
    public static SaveTasksToServer() {
        try {
            var taskstosave: PlanningTask[] = [];
            PlannerState.prodorderstosave = {};

            //get tasks where the date has changed
            var tasks = gantt.getTaskByTime() as PlanningTask[];
            for (var task of tasks) {
                if (!(task instanceof groupmarker)) {
                    PlanningTask_UpdateSetup(task);
                    var orgtask = PlannerState.original[task.id];
                    if (orgtask.start_date.getTime() != task.start_date.getTime() ||
                        orgtask.end_date.getTime() != task.end_date.getTime() ||
                        orgtask.WPPSetup != task.WPPSetup) {
                        taskstosave.push(task);

                        //copy values into correct slots
                        task.StartDate = task.start_date;
                        task.EndDate = task.end_date;

                        //group tasks by production order
                        var proid = task.PODocEntry;
                        var progrp = PlannerState.prodorderstosave[proid] || [];
                        progrp.push(task);
                        PlannerState.prodorderstosave[proid] = progrp;
                    }
                }
            }

            //If there's nothing to save
            if (Object.keys(PlannerState.prodorderstosave).length == 0) {
                PlannerState.Dirty = "no";
                return;
            }

            //init save modal
            $('#save-message-issues').css('display', 'none');
            $('#save-issues-table').hide();
            $('#save-issues-table tbody tr:not(.template)').remove();
            $('#save-issues-table tbody tr.template').hide();
            $('#save-message').removeClass('alert-success').removeClass('alert-danger').addClass('alert-primary');
            $('#save-issues-modal').modal({ backdrop: 'static', keyboard: false });

            this.SaveTasksToServerFromProdOrdersToSave(Object.keys(PlannerState.prodorderstosave).map(k => Number(k)), 0);
        } catch (e) {
            log.error(`Fault in SaveTasksToServer: ${e.toString()}`);
        }
    }

    public static SaveTasksToServerFromProdOrdersToSave(DocEntries: number[], initial_issues: number) {
        try {
            //we now have a whole collection of items to save
            //we need to send them all up to the server and wait for a response or error
            var saving = 0;
            var promises = [];
            var issues: Error[] = [];
            var savecomplete = this.generateDeferredPromise();

            $('#save-num-faulted').text(initial_issues);
            $('#save-num-saved').text(0);
            $('#save-todo-count').text(Object.keys(DocEntries).length);

            $('.btn-save-fail').hide();
            $('.btn-save-ok').hide();

            var update_save_info = () => {
                $('#save-num-saved').text(Object.keys(DocEntries).length - saving);
                $('#SaveLoaderbtn').click();
                //SaveLoader();
                $('#save-message-issues').css('display', (initial_issues + issues.length) > 0 ? 'block' : 'none');
                $('#save-num-faulted').text(initial_issues + issues.length);
                if (saving == 0) {
                    //$('#confirm_dialog2').hide();
                    $('#save-message').removeClass('alert-primary');
                    if (initial_issues + issues.length == 0) {
                        $('.btn-save-fail').hide();
                        $('.btn-save-ok').show();
                        $('#save-message').addClass('alert-success');
                        //$('#confirm_dialog2').hide();
                    } else {
                        $('.btn-save-ok').hide();
                        $('.btn-save-fail').show();
                        $('#save-message').addClass('alert-danger');
                    }
                }
            };

            for (var prosavekey of DocEntries) {
                var prosave = PlannerState.prodorderstosave[prosavekey];
                var prom = fetch(`/api/data/save-prod-ord?DocEntry=${prosavekey}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(prosave)
                });
                promises.push(prom);
                ((prosave) => {
                    prom.then(res => {
                        if (res.status != 200) {
                            res.text().then(msg => {
                                issues.push(new SaveError(prosave, `Status: ${res.status}, Message: ${msg}`));
                                saving--;
                                update_save_info();
                                if (saving == 0) {
                                    savecomplete.resolve(issues);
                                }
                            });
                        } else {
                            saving--;
                            update_save_info();
                            //Actually a reload is triggered after save, so we don't need to deal with this
                            ////save was successful so set WPPSaved flag, and the original date information
                            //for (var task of prosave) {
                            //    task.WPPSaved = true;
                            //    var tobj = Object.assign({}, task);
                            //    PlannerState.original[Number(tobj.id)] = tobj
                            //}
                            if (saving == 0) {
                                savecomplete.resolve(issues);
                            }
                        }
                    });
                    prom.catch(reason => {
                        if (reason instanceof Error) {
                            issues.push(new SaveError(prosave, reason.name, reason.message, reason.stack));
                        } else {
                            issues.push(new SaveError(prosave, reason.toString()));
                        }
                        saving--;
                        if (saving == 0) {
                            savecomplete.resolve(issues);
                        }
                    });
                })(prosave);
                saving++;
            }

            update_save_info();

            savecomplete.promise
                .then((issues: SaveError[]) => {
                    if (initial_issues + issues.length > 0) {
                        var T = $('#save-issues-table tbody tr.template');
                        var TBODY = $('#save-issues-table tbody');
                        for (var issue of issues) {
                            var I = T.clone();
                            I.find('input[name=action]').attr('name', 'action' + issue.pro[0].PODocNum);
                            I.find('.c-prodocnum').text(issue.pro[0].PODocNum);
                            I.find('.c-error').text(issue.message);
                            I.data('prodocentry', issue.pro[0].PODocEntry);
                            I.removeClass('template');
                            TBODY.append(I);
                            I.show();
                        }
                        $('#save-issues-table').show();
                    } else {
                        PlannerState.Dirty = 'no';
                        PlannerUI.OnUpdateQueryClick(null);
                    }
                });
            
        } catch (e) {
            log.error(`Fault in SaveTasksToServer: ${e.toString()}`);
        }
    }

    public static histogramClicked() {
        try {
            log.error(`Fault in histogramClicked`);
        } catch (e) {
            log.error(`Fault in histogramClicked: ${e.toString()}`);
        }
    }
}   
