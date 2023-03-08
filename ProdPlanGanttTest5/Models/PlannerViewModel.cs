using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProdPlanGanttTest5.Models
{
    public class PlannerCriteria
    {
        public string bpstart { get; set; }
        public string bpend { get; set; }
        public string itmstart { get; set; }

        public string projectstart { get; set; }
        public string projectend { get; set; }

        public string sostart { get; set; }
        public string soend { get; set; }

        public string postart { get; set; }
        public string poend { get; set; }

        public string postatus { get; set; } = "P";

        public string datetype { get; set; } = "Range";
        public DateTime? datestart { get; set; }
        public DateTime? dateend { get; set; }
        public int? workwindow { get; set; } = 28;
        public double[] cellSpacing { get; set; }
    }

    public class PlannerViewModel
    {
        public PlannerViewModel() {
            criteria = new PlannerCriteria();
        }
        public PlannerCriteria criteria;

        public IEnumerable<ResourcePlanData> ResourcePlanData { get; internal set; }
        public double[] cellSpacing { get; set; }
    }
}
