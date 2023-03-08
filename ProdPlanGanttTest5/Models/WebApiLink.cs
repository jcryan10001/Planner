namespace DHX.Gantt.Models
{
    public class WebApiLink
    {
        public string id { get; set; }
        public string type { get; set; }
        public int source { get; set; }
        public int target { get; set; }
        public long lag { get; set; }

        public static explicit operator WebApiLink(Link link)
        {
            return new WebApiLink
            {
               // id = link.Id,
                type = link.Type,
                source = link.SourceTaskId,
                target = link.TargetTaskId
            };
        }

        public static explicit operator Link(WebApiLink link)
        {
            return new Link
            {
                //Id = link.id,
                Type = link.type,
                SourceTaskId = link.source,
                TargetTaskId = link.target
            };
        }
    }

    public class Link
    {
        public string Type { get; set; }
        public int SourceTaskId { get; set; }
        public int TargetTaskId { get; set; }
    }
}
