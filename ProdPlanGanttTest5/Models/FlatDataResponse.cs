using DHX.Gantt.Models;
using PetaPoco;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProdPlanGanttTest5.Models
{
    public class FlatDataResponse
    {
        
        /// <summary>
        /// Tasks that are visible/editable are listed in the tasks view
        /// </summary>
        public List<FlatTaskRecord> tasks { get; set; }
        /// <summary>
        /// Tasks that are outside of the view but nevertheless potentially using
        /// time appear in this collection - the baseline for each task would only
        /// be calculated once because they cannot be moved unless the view is reloaded
        /// and the values changes elsewhere
        /// </summary>
        public List<FlatTaskRecord> baselinetasks { get; set; }
        public List<WebApiLink> links { get; set; }

        //The data query will vary the start/end dates as appropriate
        //the final date range to use will be passed here
        public DateTime timelinestart { get; set; }
        public DateTime timelineend { get; set; }
        public IEnumerable<ResourcePlanData> internalcapacities { get; internal set; }
    }
}
