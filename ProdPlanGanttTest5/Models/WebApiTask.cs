using System;

using System.Text.Encodings.Web;

using ProdPlanGanttTest5.Models;

namespace DHX.Gantt.Models
{
    public class WebApiTask
    {
        public int id { get; set; }
        public string text { get; set; }
        public string start_date { get; set; }
        public string end_date { get; set; }
        public int duration { get; set; }
        public decimal progress { get; set; }
        public int? parent { get; set; }
        public string type { get; set; }
        public string target { get; set; }
        public bool editable { get; set; }
        public bool open { get; set; }
        public bool owner_id { get; set; }
        public bool rollup { get; set; }
        public bool hide_bar { get; set; }
        public string mode { get; set; }

        //resources

        public System.Collections.Generic.List<WebApiTaskResource> users { get; set; }
        //public System.Collections.Generic.List<WebApiTaskResource> WorkDist { get; set; }

        //project custom
        public string custom_customer_deadline { get; set; }
        public int custom_work_hours { get; set; }

        public static explicit operator WebApiTask(Task task)
        {
            return new WebApiTask
            {
                id = task.Id,
                text = HtmlEncoder.Default.Encode(task.Text),
                start_date = task.StartDate.ToString("yyyy-MM-dd HH:mm"),
                duration = task.Duration,
                parent = task.ParentId,
                type = task.Type,
                progress = task.Progress
            };
        }

        public static explicit operator Task(WebApiTask task)
        {

            return new Task
            {
                Id = task.id,
                Text = task.text,
                StartDate = DateTime.Parse(task.start_date, System.Globalization.CultureInfo.InvariantCulture),
                Duration = task.duration,
                ParentId = task.parent,
                Type = task.type,
                Progress = task.progress
            };
        }
    }

    public class WebApiTaskResource
    {
        public string resource_id { get; set; }
        public int value { get; set; }
        public DateTime workdist_day { get; set; }
    }
    public class WebApiResource
    {
        public string id { get; set; }
        public string text { get; set; }
        public int capacity { get; set; }
        public string parent { get; set; }      //for links between depts
        //public string department { get; set; }  //for links from staff to dept
    }

}



