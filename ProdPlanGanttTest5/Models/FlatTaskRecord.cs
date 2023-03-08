using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProdPlanGanttTest5.Models
{
    public class FlatTaskRecord
    {
		public string BPDescription { get; set; }
		public string PODescription { get; set; }
		public string PNDescription { get; set; }
		public string ACTDescription { get; set; }
		public string ItemDescription { get; set; }
		public int PODocEntry { get; set; }
		public int PODocNum { get; set; }
		public string POCardCode { get; set; }
		public string POItemCode { get; set; } 
		public string POStatus { get; set; }
		public int POPlannedQuantity { get; set; }
		public int POCompletedQuantity { get; set; }
		public DateTime POStartDate { get; set; }
		public DateTime POEndDate { get; set; }
		public string POProdName { get; set; }
		public int POPriority { get; set; }
		public int LineNum { get; set; }
		public int VisOrder { get; set; }
		public string Resource { get; set; }
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }
		public string StageID { get; set; }
		public double IssuedQuantity { get; set; }
		public double BookedQuantity { get; set; }
		public string AdditionalQuantity { get; set; }
		public double PlannedHours { get; set; }
		public string ResName { get; set; }
		public string ResType { get; set; }
		public string WhsCode { get; set; }
		public int SODocEntry { get; set; }
		public int SODocNum { get; set; }
		public string SODate { get; set; }
		public string Project { get; set; }
		public string StgName { get; set; }
		public int StgSeqNum { get; set; }
		public string StgStatus { get; set; }
		public DateTime StgStartDate { get; set; }
		public DateTime StgEndDate { get; set; }

		public DateTime? ProjectStartDate { get; set; }
		public DateTime? ProjectEndDate { get; set; }

		public DateTime? ActivityStartDate { get; set; }
		public DateTime? ActivityEndDate { get; set; }

		//Mandatory properties for DHX Gantt
		public string text => $"{PODocNum}/{LineNum}: {ResName}";
		public string start_date => StartDate.ToString("yyyy-MM-dd");
		public int duration => (EndDate - StartDate).TotalDays == 0 ? 1 : (int)(EndDate - StartDate).TotalDays;
		public string id => $"{PODocEntry}/{LineNum}";

		////Optional properties for DHX gantt
		//public string type => "task";

		//public string parent => null;
		public double progress { get; set; } = 0.0;
		public double pro_progress { get; set; } = 0.0;
		//public DateTime end_date => EndDate;

		public int? lead_time { get; set; }
		public bool WPPSaved { get; set; }
		public string WPPSetup { get; set; }
		public string OpDescription { get; set; }
		public string status { get; set; }
		public string originalPlannedQty { get; set; }
	}

	public class SavedTaskRecord
	{
		public int PODocEntry { get; set; }
		public int PODocNum { get; set; }
		public int LineNum { get; set; }
		public DateTimeOffset StartDate { get; set; }
		public DateTimeOffset EndDate { get; set; }
		public int SODocEntry { get; set; }
		public int SODocNum { get; set; }
		public string Project { get; set; }
		public string StageID { get; set; }

		public string WPPSetup { get; set; }
	}
	public class filterDataList
	{
		public string BP { get; set; }
		public string PN { get; set; }
		public int SO { get; set; }
		public int PO { get; set; }
		public DateTime startDate { get; set; }
		public DateTime endDate { get; set; }

		public string BPDesc { get; set; }
		public string PODesc { get; set; }
		public string PNDesc { get; set; }
		public string ItemDesc { get; set; }
		public string Item { get; set; }
	}

	public class GraphDataPoint
	{
		public DateTime theDate { get; set; }
		public int freq { get; set; }
	}
	public class GraphDataPointRaw
	{

		public string item { get; set; }
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }

	}
	public class BPDataPoint
	{
		public string BPCode { get; set; }
		public string BPDesc { get; set; }
	}
}
