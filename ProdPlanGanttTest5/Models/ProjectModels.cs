using System;

namespace ProdPlanGanttTest5.Models
{
    public class ProjectResource
    {
        public string parent_key { get; set; }
        public string resource_key { get; set; }
        public string description { get; set; }
    }

    public class ProjectPlanning
    {
        public string parent_key { get; set; }
        public string resource_key { get; set; }
        public string description { get; set; }
        public string planning_key { get; set; }
        public string external_code { get; set; }
        public string type_name { get; set; }
        public string project_number { get; set; }
        public DateTime? actual_start { get; set; }
        public DateTime? actual_finish { get; set; }
        public DateTime? schedule_start { get; set; }
        public DateTime? schedule_finish { get; set; }
        public DateTime? milestone_date { get; set; }
        public string status { get; set; }
        public DateTime? customer_finish { get; set; }
    }

    public class ProjectPlanningConstraint
    {
        public string from_key { get; set; }
        public string to_key { get; set; }
        public string type { get; set; }
        //public System.Collections.Generic.Dictionary<int,int> lag { get; set; }
    }

    public class ProjectWork
    {
        public string planning_key { get; set; }
        public string resource_key { get; set; }
        public int minutes { get; set; }
    }

    public class Task
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public DateTime StartDate { get; set; }
        public int Duration { get; set; }
        public int? ParentId { get; set; }
        public string Type { get; set; }
        public decimal Progress { get; set; }
    }

    public class SalesOrders
    {
        public int DocNum { get; set; }
        public int DocEntry { get; set; }
        public string CardCode { get; set; }
        public string CardName { get; set; }
        public DateTime DocDueDate { get; set; }
    }

    public class ProductionOrders
    {
        public int DocNum { get; set; }
        public int DocEntry { get; set; }
        public string CardCode { get; set; }
        public int OriginNum { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public double PlannedQuantity { get; set; }
        public double CompletedQuantity { get; set; }
    }

    public class ProductionOrderLines
    {
        public int VisOrder { get; set; }
        public int LineNum { get; set; }
        public int? StageId { get; set; }
        public int DocEntry { get; set; }
        public string Resource { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int StartTime { get; set; }
        public int EndTime { get; set; }
        public double PlannedQty { get; set; }
        public double IssuedQty { get; set; }
        public string ResName { get; set; }
        public int OperationSequenceNumber { get; set; }
        public double AdditionalQty { get; set; }
    }

    public class RouteStages
    {
        public int ProdOrderDocEntry { get; set; }
        public int StageId { get; set; }
        public int SeqNum { get; set; }
        public int StgEntry { get; set; }
        public string Name { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; }
    }

    public class ResourceData
    {
        public int ResGrpCod { get; set; }
        public string ResCode { get; set; }
        public string ResName { get; set; }
        public string ResType { get; set; }
    }

    public class ResourcePlanData
    {
        public string ResCode { get; set; }
        public string WhsCode { get; set; }
        public int WeekDay { get; set; }
        public decimal SngRunCap { get; set; }
        public DateTime CapDate { get; set; }
    }
}