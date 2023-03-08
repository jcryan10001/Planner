using System.Collections.Generic;
using System.Linq;

using Microsoft.AspNetCore.Mvc;
using DHX.Gantt.Models;
using System;

using ProdPlanGanttTest5.Models;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using SAPB1Commons.ServiceLayer;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using ProdPlanGanttTest5.Services;
using Microsoft.AspNetCore.Http;

namespace DHX.Gantt.Controllers
{
    [Authorize]
    [Produces("application/json")]
    [Route("api/data")]
    public class DataController : Controller
    {
        public readonly TimeSpan RECENT = TimeSpan.FromDays(14);

        PetaPoco.IDatabaseBuildConfiguration databaseConfig;
        private readonly IServiceProvider sp;
        private readonly IOptions<Settings.ProductionPlannerSettings> _ppconfig = null;
        private readonly ILogger<DataController> _logger = null;
        private readonly DataService _ds;
        public List<FlatTaskRecord> records { 
            get {
                var json = HttpContext.Session.GetString("recordsjson");
                if (json == null)
                {
                    return null;
                }
                return System.Text.Json.JsonSerializer.Deserialize<List<FlatTaskRecord>>(json);
            }
            set {
                var json = System.Text.Json.JsonSerializer.Serialize(value);
                HttpContext.Session.SetString("recordsjson", json);
            } 
        }
        private bool IsHana { get; set; }
        
        //public List<task>
        public DataController(IServiceProvider sp, ILogger<DataController> logger, IOptions<Settings.ConnectionDetails> config, IOptions<Settings.ProductionPlannerSettings> ppconfig, DataService ds)
        {
            SAPB1Commons.B1Types.DatabaseType DBServerType;
            IsHana = config.Value.DBType.ToUpper() == "HANA";
            if (IsHana)
            {
                DBServerType = SAPB1Commons.B1Types.DatabaseType.Hana;
            }
            else
            {
                DBServerType = SAPB1Commons.B1Types.DatabaseType.MsSql;
            };

            var conf = new SAPB1Commons.B1Types.B1DirectDBProfile() { DatabaseName = config.Value.DatabaseName, DBPassword = config.Value.DBPassword, DBServerName = config.Value.DBServerName, DBType = DBServerType, DBUserName = config.Value.DBUserName, ServiceLayerURL = config.Value.ServiceLayerURL, DBTenantName = config.Value.DBTenantName };
            databaseConfig = SAPB1Commons.PetaPocoConnectionBuilder.BuildSAPBusinessOneConfigForPetaPoco(conf);
            this.sp = sp;

            _ppconfig = ppconfig;
            _logger = logger;
            _ds = ds;
        }

        //TODO: Add a validation function so that the client form can collect validation errors

        private async Task<string> GetPermission()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return "None";
            }
            //our passwords are recognised, now we need to determine what this users effective rights are for this program
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                var query = $@"select 
	                case when upper(""U_WPPPermission"") in ('NONE', 'READ ONLY', 'FULL') then
                        ""U_WPPPermission""
                    else
                        (select top 1 * from(
                            select ""U_ConfigData"" from ""@@OCHAPPCFG"" where ""U_ProgID"" = 'WPPDefaultPermission' and upper(""U_ConfigData"") IN('NONE', 'READ ONLY', 'FULL')
                        union select 'None' as ""U_ConfigData""{(IsHana ? " from dummy" : "")}) acfg)
	                end ""Permission""
                    from OUSR where USER_CODE = @Username";
                return await ppdb.ExecuteScalarAsync<string>(query, new { Username = User.Identity.Name });
            }
        }

        [HttpPost("preference/{keyname}")]
        public async Task<bool> SetPreference(string keyname, [FromBody] dynamic value)
        {
            if (!User.Identity.IsAuthenticated)
            {
                return false;
            }
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                var userkey = $"{User.Identity.Name}.{keyname}";
                var JsonVal = value == null ? JValue.CreateNull() : JToken.FromObject(value);
                var JsonStr = JsonVal.ToString(Newtonsoft.Json.Formatting.None);
                if (await HasPreference(keyname))
                {
                    var query = $@"update ""@@OCH_USERPREFS"" set ""U_Json"" = @Json, ""U_Updated"" = @Updated where ""U_ItemType"" = 'WebProdPlan/Gantt' and ""U_UserKey"" = @UserKey";
                    await ppdb.ExecuteAsync(query, new { Json = JsonStr, Updated = DateTime.Now, UserKey = userkey });
                }
                else
                {
                    var query = $@"insert into ""@@OCH_USERPREFS"" (""Code"", ""Name"", ""U_UserKey"", ""U_ItemType"", ""U_Json"", ""U_Created"", ""U_Updated"") values (
	                    (SELECT coalesce((SELECT CAST(MAX(""Code"") AS integer) FROM ""@@OCH_USERPREFS""), 0) + 1{(IsHana ? " from dummy" : "")}),
	                    (SELECT coalesce((SELECT CAST(MAX(""Code"") AS integer) FROM ""@@OCH_USERPREFS""), 0) + 1{(IsHana ? " from dummy" : "")}),
                        @UserKey, @ItemType, @Json, @Created, @Updated)";
                    await ppdb.ExecuteAsync(query, new { UserKey = userkey, ItemType= "WebProdPlan/Gantt", Json = JsonStr, Created = DateTime.Now, Updated = DateTime.Now,  });
                }
                return true;
            }
        }

        [HttpGet("has-preference/{keyname}")]
        public async Task<bool> HasPreference(string keyname)
        {
            if (!User.Identity.IsAuthenticated)
            {
                return false;
            }
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                var query = $@"select sum(1) as Ex from ""@@OCH_USERPREFS"" where ""U_ItemType"" = 'WebProdPlan/Gantt' and ""U_UserKey"" = @UserKey";
                var ExistCount = await ppdb.ExecuteScalarAsync<int?>(query, new { UserKey = $"{User.Identity.Name}.{keyname}" });
                return (ExistCount ?? 0) > 0;
            }
        }

        [HttpGet("preference/{keyname}")]
        public async Task<dynamic> GetPreference(string keyname)
        {
            if (!User.Identity.IsAuthenticated)
            {
                return null;
            }
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                var query = $@"select ""U_Json"" from ""@@OCH_USERPREFS"" where ""U_ItemType"" = 'WebProdPlan/Gantt' and ""U_UserKey"" = @UserKey";
                var strval = await ppdb.ExecuteScalarAsync<string>(query, new { UserKey = $"{User.Identity.Name}.{keyname}" });
                if (string.IsNullOrWhiteSpace(strval))
                {
                    return null;
                }
                var JsonVal = JToken.Parse(strval);
                return JsonVal;
            }
        }

        [HttpPost("flat-task-data")]
        public async Task<ActionResult<FlatDataResponse>> GetFlatData([FromBody] PlannerCriteria criteria)
        {
            var bpstart = criteria.bpstart;
            var sostart = criteria.sostart;
            var postart = criteria.postart;
            var pnstart = criteria.projectstart;
            var wincheck = criteria.workwindow;
            var itmstart = criteria.itmstart;

            //Permission check
            //Add the permission as a header
            //If the permission is "None" return null
            var permission = await GetPermission();
            this.HttpContext.Response.Headers.Add("x-wpp-permission", permission);
            if (permission.Equals("None", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(401, "User does not have read access.");
            }

            if (criteria == null)
            {
                criteria = new PlannerCriteria();
            }

            var startdate = DateTime.Today.AddMonths(-12);
            var enddate = DateTime.Today.AddMonths(12);


            var coreflatsql = $@"select
    RD.""CardName"" as ""BPDescription"",PO.""ProdName"" as ""PODescription"",M.""ItemName"" as ""ItemDescription"",PL.""U_OpDescription"" as ""OpDescription"",PL.""U_LastStatus"" as ""U_LastStatus"",PL.""PlannedQty"" as ""originalPlannedQty"",
    {{{{project_activity}}}}
    PO.""DocEntry"" as ""PODocEntry"", PO.""DocNum"" as ""PODocNum"", PO.""CardCode"" as ""POCardCode"", PO.""ItemCode"" as ""POItemCode"", PO.""Status"" as ""POStatus"", PO.""PlannedQty"" as ""POPlannedQuantity"", PO.""CmpltQty"" as ""POCompletedQuantity"", PO.""StartDate"" as ""POStartDate"", PO.""DueDate"" as ""POEndDate"", PO.""CreateDate"", PO.""ProdName"", PO.""Priority"",
    PL.""DocEntry"", PL.""LineNum"", PL.""ItemCode"" as ""Resource"", PL.""wareHouse"" as ""WhsCode"", PL.""StartDate"", PL.""EndDate"", PL.""VisOrder"", PL.""StageId"", PL.""PlannedQty"",
	{{{{issued_quantity}}}},
	{{{{booked_quantity}}}},
    Pl.""AdditQty"" as ""AdditionalQuantity"",
	Coalesce(PL.""PlannedQty"" * R.""TimeResUn"" / R.""NumResUnit"" / 3600.0, 0.0) as ""PlannedHours"",
	R.""ResCode"", coalesce(R.""ResName"", OITM.""ItemName"") as ""ResName"", R.""ResType"",
    O.""DocEntry"" as ""SODocEntry"", O.""DocNum"" as ""SODocNum"", O.""DocDueDate"" as ""SODate"", 
    ST.""Name"" as ""StgName"", ST.""SeqNum"" as ""StgSeqNum"", ST.""Status"" as ""StgStatus"", ST.""StartDate"" as ""StgStartDate"", ST.""EndDate"" as ""StgEndDate"",
    {{{{project_dates}}}}    
    case when PO.""U_WPPSaved"" = 'Y' then 1 else 0 end as ""WPPSaved"",
    ""U_WPPSetup"" as ""WPPSetup"",
    OITM.""LeadTime"" as ""lead_time"",
    {{{{progress}}}}
from OWOR PO
{{{{tasks_join}}}}
{{{{project_dates_join}}}}
left join OCRD RD on PO.""CardCode"" = RD.""CardCode""
left join OITM M on PO.""ItemCode"" = M.""ItemCode""
left join ORSC R on PL.""ItemCode"" = R.""ResCode""
left join ORDR O on PO.""OriginAbs"" = O.""DocEntry""
left join OPRJ RJ on O.""Project"" = RJ.""PrjCode""
left join WOR4 ST on PO.""DocEntry"" = ST.""DocEntry"" and PL.""StageId"" = ST.""StageId""
left join OPMG PM on PO.""Project"" = PM.""FIPROJECT""
left join OPMG PM2 on O.""Project"" = PM.""FIPROJECT""
{{{{iteminfo_join}}}}
";

            string tasks_join_sql = "", iteminfo_join_sql = "";
            if (_ppconfig.Value.EnableSubCon)
            {
                tasks_join_sql = $@"inner join WOR1 PL on PO.""DocEntry"" = PL.""DocEntry"" and (PL.""ItemType"" = 290 or coalesce(PL.""U_SubconItem"",'N') = 'Y')";
                iteminfo_join_sql = $@"left join OITM on OITM.""ItemCode"" = PL.""ItemCode"" and PL.""ItemType"" = 4 and coalesce(OITM.""U_SubConServiceItem"", 'N') = 'Y'";
            } else
            {
                tasks_join_sql = $@"inner join WOR1 PL on PO.""DocEntry"" = PL.""DocEntry"" and PL.""ItemType"" = 290";
                //We don't pull through OITM data unless it's a subcon item (in subcon enabled mode)
                iteminfo_join_sql = $@"left join OITM on 0=1";
            }
            coreflatsql = coreflatsql.Replace("{{tasks_join}}", tasks_join_sql);
            coreflatsql = coreflatsql.Replace("{{iteminfo_join}}", iteminfo_join_sql);
            string progress_sql = "";
            string project_activity = "";
            string project_dates = "";
            string project_dates_join = "";
            if (_ppconfig.Value.EnableIAProject)
            {
                //A solution exists where SFDC vetoes resource issue and instead accrues time into a UDF
                //this allows a IssuedTime over Planned time calculation

                progress_sql = $@"cast(case when Coalesce(PL.""PlannedQty"" * R.""TimeResUn"" / R.""NumResUnit"" / 3600.0, 0.0) = 0 then 0 else
                                    PL.""U_IssuedTime"" / Coalesce(PL.""PlannedQty"" * R.""TimeResUn"" / R.""NumResUnit"" / 3600.0, 0.0)
                                end as float) as ""progress"",
                                cast(PO.""CmpltQty"" / PO.""PlannedQty"" as float) as ""pro_progress"" ";
                project_dates = $@"COALESCE(PRDT.""schedule_start"", COALESCE(PM.""START"", PM2.""START"")) as ""ProjectStartDate"", COALESCE(PRDT.""schedule_finish"", COALESCE(PM.""DUEDATE"", PM2.""DUEDATE"")) as ""ProjectEndDate"",";
                project_dates_join = $@"LEFT JOIN (select G.""SAP_DocEntry"", 
    P.""planning_key"", case when coalesce(P.""sproject_number"", '') = '' then P.""project_number"" else concat(concat(P.""project_number"", '/'), P.""sproject_number"") end as ""project_number"", P.""description"" as ""PNDescription"", P.""schedule_start"", P.""schedule_finish"",
	A.""planning_key"", A.""description"" as ""ACTDescription"", A.""schedule_start"" as ""ACTschedule_start"", A.""schedule_finish"" as ""ACTschedule_finish""
from ""BxPro_group_orders"" G
inner join ""BxPro_planning"" P on G.""project_planning_key"" = P.""planning_key"" and P.""budget_key"" = 'E000000000'
inner join ""BxPro_planning"" A on G.""original_planning_key"" = A.""planning_key"" and A.""budget_key"" = 'E000000000'
where G.""SAP_DocType"" = 202 and G.""is_deleted"" <> 'Y') PRDT on PO.""DocEntry"" = PRDT.""SAP_DocEntry""";
                project_activity = $@"PRDT.""PNDescription"", PRDT.""ACTDescription"", PRDT.""ACTschedule_start"" as ""ActivityStartDate"", PRDT.""ACTschedule_finish"" as ""ActivityEndDate"", coalesce(PRDT.""project_number"", O.""Project"") as ""Project"", ";
            } else
            {
                //by default we divide IssuedQty by PlannedQty and the units are not relevant
                progress_sql = $@"cast(case when Coalesce(PL.""PlannedQty"" * R.""TimeResUn"" / R.""NumResUnit"" / 3600.0, 0.0) = 0 then 0 else
                                    PL.""IssuedQty"" / Coalesce(PL.""PlannedQty"", 0.0) 
                                end as float) as ""progress"",
                                cast(PO.""CmpltQty"" / PO.""PlannedQty"" as float) as ""pro_progress"" ";
                project_dates = $@"COALESCE(PM.""START"", PM2.""START"") as ""ProjectStartDate"", COALESCE(PM.""DUEDATE"", PM2.""DUEDATE"") as ""ProjectEndDate"",";
                project_dates_join = "";
                project_activity = $@"Concat('Project: ', O.""Project"") as ""PNDescription"", '' as ""ACTDescription"", null as ""ActivityStartDate"", null as ""ActivityEndDate"", O.""Project"", ";
            }

            if (_ppconfig.Value.EnablePrOLineIssuedTimeUDF)
            {
                var maxissued = $@"case when coalesce(PL.""IssuedQty"", 0) > coalesce(PL.""U_IssuedTime"", 0) then cast(coalesce(PL.""IssuedQty"", 0) as double) else cast(coalesce(PL.""U_IssuedTime"", 0) as double) end";
                coreflatsql = coreflatsql.Replace("{{issued_quantity}}", $@"{maxissued} as ""IssuedQuantity""");
                progress_sql = $@"cast(case when Coalesce(PL.""PlannedQty"" * R.""TimeResUn"" / R.""NumResUnit"" / 3600.0, 0.0) = 0 then 0 else
                                    {maxissued} / Coalesce(PL.""PlannedQty"" * R.""TimeResUn"" / R.""NumResUnit"" / 3600.0, 0.0)
                                end as float) as ""progress"",
                                cast(PO.""CmpltQty"" / PO.""PlannedQty"" as float) as ""pro_progress"" ";
            }
            else
            {
                coreflatsql = coreflatsql.Replace("{{issued_quantity}}", @"PL.""IssuedQty"" as ""IssuedQuantity""");
            }

            if (_ppconfig.Value.EnablePrOLineBookedQuantityUDF)
            {
                coreflatsql = coreflatsql.Replace("{{booked_quantity}}", @"cast(coalesce(PL.""U_BookedQty"", 0) as double) as ""BookedQuantity""");
            }
            else
            {
                coreflatsql = coreflatsql.Replace("{{booked_quantity}}", @"0 as ""BookedQuantity""");
            }

            coreflatsql = coreflatsql.Replace("{{project_activity}}", project_activity);
            coreflatsql = coreflatsql.Replace("{{progress}}", progress_sql);
            coreflatsql = coreflatsql.Replace("{{project_dates}}", project_dates);
            coreflatsql = coreflatsql.Replace("{{project_dates_join}}", project_dates_join);

            //criteria - we need the criteria sql fragments AND the negated sql fragments
            var parms = new List<object>();
            var criteriastrings = new List<string>();
            var revcriteriastrings = new List<string>();

            #region "Business Partner Filter"
            if (bpstart != "" && bpstart != null)
            {
                criteriastrings.Add("PO.\"CardCode\" IN (" + bpstart + ")");
                revcriteriastrings.Add("PO.\"CardCode\" NOT IN (" + bpstart + ")");

            }
            /*            var bps = new List<string>();
                        bps.Add(!string.IsNullOrWhiteSpace(criteria.bpstart) ? criteria.bpstart : null);
                        bps.Add(!string.IsNullOrWhiteSpace(criteria.bpend) ? criteria.bpend : null);
                        if (bps.Any(bp => bp != null)) {
                            if (bps[0] == null)
                            {
                                criteriastrings.Add("PO.\"CardCode\" <= @CardCodeTo");
                                revcriteriastrings.Add("PO.\"CardCode\" > @CardCodeTo");
                                parms.Add(new { CardCodeTo = bps[1] });
                            }
                            else if (bps[1] == null)
                            {
                                criteriastrings.Add("PO.\"CardCode\" IN (@CardCodeFrom)");
                                revcriteriastrings.Add("PO.\"CardCode\" NOT IN (@CardCodeFrom)");
                                parms.Add(new { CardCodeFrom = bps[0] });
                            }
                            else { 
                                if (StringComparer.OrdinalIgnoreCase.Compare(criteria.bpstart, criteria.bpend) > 0)    { bps.Reverse(); }
                                criteriastrings.Add("PO.\"CardCode\" >= @CardCodeFrom AND PO.\"CardCode\" <= @CardCodeTo");
                                revcriteriastrings.Add("PO.\"CardCode\" < @CardCodeFrom OR PO.\"CardCode\" > @CardCodeTo");
                                parms.Add(new { CardCodeFrom = bps[0], CardCodeTo = bps[1] });
                            }
                        }*/
            #endregion



            #region "item Filter"
            if (itmstart != "" && itmstart != null)
            {
                criteriastrings.Add("PO.\"ItemCode\" IN (" + itmstart + ")");
                revcriteriastrings.Add("PO.\"ItemCode\" NOT IN (" + itmstart + ")");

            }
            #endregion

            #region "Project Number Filter"
            if (pnstart != "" && pnstart != null)
            {
                criteriastrings.Add("PO.\"Project\" IN (" + pnstart + ")");
                revcriteriastrings.Add("PO.\"Project\" NOT IN (" + pnstart + ")");

            }
/*            var prjs = new List<string>();
            prjs.Add(!string.IsNullOrWhiteSpace(criteria.projectstart) ? criteria.projectstart : null);
            prjs.Add(!string.IsNullOrWhiteSpace(criteria.projectend) ? criteria.projectend : null);
            if (prjs.Any(prj => prj != null))
            {
                if (prjs[0] == null)
                {
                    criteriastrings.Add("PO.\"Project\" <= @ProjectTo");
                    revcriteriastrings.Add("PO.\"Project\" > @ProjectTo");
                    parms.Add(new { ProjectTo = prjs[1] });
                }
                else if (prjs[1] == null)
                {
                    criteriastrings.Add("PO.\"Project\" IN (@ProjectFrom)");
                    revcriteriastrings.Add("PO.\"Project\" NOT IN @ProjectFrom");
                    parms.Add(new { ProjectFrom = prjs[0] });
                }
                else
                {
                    if (StringComparer.OrdinalIgnoreCase.Compare(criteria.projectstart, criteria.projectend) > 0) { prjs.Reverse(); }
                    criteriastrings.Add("PO.\"Project\" >= @ProjectFrom AND PO.\"Project\" <= @ProjectTo");
                    revcriteriastrings.Add("PO.\"Project\" < @ProjectFrom OR PO.\"Project\" > @ProjectTo");
                    parms.Add(new { ProjectFrom = prjs[0], ProjectTo = prjs[1] });
                }
            }*/
            #endregion

            #region "Sales Order Number Filter"
            if (sostart != "" && sostart != null)
            {
                criteriastrings.Add("O.\"DocNum\" IN (" + sostart + ")");
                revcriteriastrings.Add("O.\"DocNum\" NOT IN (" + sostart + ")");

            }
            /*var sos = new List<int>();
            if (!string.IsNullOrWhiteSpace(criteria.sostart) && int.TryParse(criteria.sostart, out _))
            {
                sos.Add(int.Parse(criteria.sostart));
            } else
            {
                sos.Add(-1);
            }
            if (!string.IsNullOrWhiteSpace(criteria.soend) && int.TryParse(criteria.soend, out _))
            {
                sos.Add(int.Parse(criteria.soend));
            }
            else
            {
                sos.Add(-1);
            }
            if (sos.Any(sos => sos != -1))
            {
                if (sos[0] == -1)
                {
                    criteriastrings.Add("O.\"DocNum\" <= @SONumTo");
                    revcriteriastrings.Add("O.\"DocNum\" > @SONumTo");
                    parms.Add(new { SONumTo = sos[1] });
                }
                else if (sos[1] == -1)
                {
                    criteriastrings.Add("O.\"DocNum\" IN (@SONumFrom)");
                    revcriteriastrings.Add("O.\"DocNum\" NOT IN (@SONumFrom)");
                    parms.Add(new { SONumFrom = sos[0] });
                }
                else
                {
                    if (sos[0] > sos[1]) { sos.Reverse(); }
                    criteriastrings.Add("O.\"DocNum\" >= @SONumFrom AND O.\"DocNum\" <= @SONumTo");
                    revcriteriastrings.Add("O.\"DocNum\" < @SONumFrom OR O.\"DocNum\" > @SONumTo");
                    parms.Add(new { SONumFrom = sos[0], SONumTo = sos[1] });
                }
            }*/
            #endregion

            #region "Project Order Number Filter"
            if (postart != "" && postart != null)
            {
                criteriastrings.Add("PO.\"DocNum\" IN (" + postart + ")");
                revcriteriastrings.Add("PO.\"DocNum\" NOT IN (" + postart + ")");
                //parms.Add(new { PONumFrom = postart });
            }
            /*var pos = new List<string>();
            if (!string.IsNullOrWhiteSpace(criteria.postart) && int.TryParse(criteria.postart, out _))
            {
                pos.Add(criteria.postart);
            } 
            else
            {
                pos.Add("-1");
            }

            if (!string.IsNullOrWhiteSpace(criteria.poend) && int.TryParse(criteria.poend, out _))
            {
                pos.Add(criteria.poend);
            }
            else
            {
                pos.Add("-1");
            }
            if (pos.Any(pos => pos != "-1"))
            {

                if (pos[0] == "-1")
                {
                    criteriastrings.Add("PO.\"DocNum\" <= @PONumTo");
                    revcriteriastrings.Add("PO.\"DocNum\" > @PONumTo");
                    parms.Add(new { PONumTo = pos[1] });
                }
                else if (pos[1] == "-1")
                {
                    criteriastrings.Add("PO.\"DocNum\" IN (@PONumFrom)");
                    revcriteriastrings.Add("PO.\"DocNum\" NOT IN (@PONumFrom)");
                    parms.Add(new { PONumFrom = pos[0] });
                }
                else
                {
                   // if (pos[0] > pos[1]) { pos.Reverse(); }
                    criteriastrings.Add("PO.\"DocNum\" >= @PONumFrom AND PO.\"DocNum\" <= @PONumTo");
                    revcriteriastrings.Add("PO.\"DocNum\" < @PONumFrom OR PO.\"DocNum\" > @PONumTo");
                    parms.Add(new { PONumFrom = pos[0], PONumTo = pos[1] });
                }
            }*/
            #endregion

            #region "Production Order Status Filter"
            switch (criteria.postatus)
            {
                case "R":
                    criteriastrings.Add("PO.\"Status\" in ('R')");
                    revcriteriastrings.Add("PO.\"Status\" in ('P', 'L')");
                    break;
                case "PR":
                    criteriastrings.Add("PO.\"Status\" in ('P', 'R')");
                    revcriteriastrings.Add("PO.\"Status\" in ('L')");
                    break;
                case "P":
                    criteriastrings.Add("PO.\"Status\" in ('P')");
                    revcriteriastrings.Add("PO.\"Status\" in ('R','L')");
                    break;
                default:
                    criteriastrings.Add("PO.\"Status\" in ('P')");
                    revcriteriastrings.Add("PO.\"Status\" in ('R', 'L')");
                    break;
            }
            #endregion

            #region "Date Range Filter"
            var dates = new List<DateTime?>();
            if (criteria.datestart.HasValue) 
            {
                dates.Add(criteria.datestart);
            }
            else if (this.RouteData.Values?["datestart"]?.ToString() == "-") {
                dates.Add(DateTime.MinValue);
            }
            if (criteria.dateend.HasValue)
            {
                dates.Add(criteria.dateend);
            }
            else if (this.RouteData.Values?["dateend"]?.ToString() == "-")
            {
                dates.Add(DateTime.MaxValue);
            }
            if (dates.Count > 1)
            {
                if (dates[0] > dates[1]) { dates.Reverse(); }
                parms.Add(new { DateFrom = dates[0].Value, DateTo = dates[1].Value.AddDays(1) });
            }
            else if (dates.Count > 0)
            {
                parms.Add(new { DateFrom = dates[0].Value, DateTo = dates[0].Value.AddDays(1) });
            } else
            {
                dates.Add(startdate);
                dates.Add(enddate);
                parms.Add(new { DateFrom = dates[0].Value, DateTo = dates[0].Value.AddDays(1) });
            }
            #endregion

            //TODO: Alternate date filter between 3 kinds - for now Date Type is not specified
            //RAB: Date params not working it seems - criteriastrings.Add("PO.\"StartDate\" < @DateTo and PO.\"DueDate\" > @DateFrom");
            criteriastrings.Add($"PO.\"StartDate\" < '{dates.Last().Value.ToString("yyyy-MM-dd")}' and PO.\"DueDate\" > '{dates.First().Value.ToString("yyyy-MM-dd")}'");

            //Main data fetch SQL
            var flatsql = _ppconfig.Value.EnableSubCon ?
                $"{coreflatsql} WHERE (PL.\"ItemType\" = 290 OR coalesce(OITM.\"U_SubConServiceItem\", 'N') = 'Y') AND ({string.Join(") AND (", criteriastrings)}) ORDER BY PO.\"DocNum\", PL.\"VisOrder\"" :
                $"{coreflatsql} WHERE ({string.Join(") AND (", criteriastrings)}) ORDER BY PO.\"DocNum\", PL.\"VisOrder\"";

            //1) We read the tasks that we're focussing on
            //2) We extend the date range to capture the full task/SO/Project time periods
            //3) We can extend the end date based on the work window
            //4) We can read the baseline data by using the reverse criteria over then new date range
            //5) we can read calendar data by using the new date range

            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                if (_ppconfig.Value.Debug?.WriteFlatDataQuery ?? false)
                {
                    _logger.LogDebug($"Debug.FlatDataQuery: {flatsql}");
                }

                var tasks = (await ppdb.FetchAsync<FlatTaskRecord>(flatsql, parms.ToArray())).ToList();
                foreach(var task in tasks)
                {
                    if(task.POCardCode == null)
                    {
                        task.POCardCode = "";
                        task.BPDescription = "No Business Partner";
                    }
                    if (task.BPDescription == null)
                    {
                        task.BPDescription = "";
                    }
                    if (task.Project == null)
                    {
                        task.Project = "";
                        task.PNDescription = "No Project Number";
                    }
                    if (task.PNDescription == null)
                    {
                        task.PNDescription = "";
                    }
                    if (task.PODescription == null)
                    {
                        task.PODescription = "No Production Order";
                    }
                    if (task.ItemDescription == null)
                    {
                        task.PODescription = "No Item";
                    }

                }
                //Calculate new date range window
                startdate = dates.First().Value;
                enddate = dates.Last().Value;

                //Calculate new date range window from tasks list data
                var startdates = new List<DateTime?>();
                var enddates = new List<DateTime?>();
                foreach (var t in tasks)
                {
                    startdates.Clear();
                    enddates.Clear();
                    startdates.Add(startdate);
                    enddates.Add(enddate);
                    if (t.POStartDate != DateTime.MinValue)
                    {
                        startdates.Add(t.POStartDate);
                    }
                    enddates.Add(t.POEndDate);
                    if (t.StartDate != DateTime.MinValue)
                    {
                        startdates.Add(t.StartDate);
                    }
                    enddates.Add(t.EndDate);
                    if (t.StgStartDate != DateTime.MinValue)
                    {
                        startdates.Add(t.StgStartDate);
                    }
                    enddates.Add(t.StgEndDate);
                    if (t.ProjectStartDate != DateTime.MinValue)
                    {
                        startdates.Add(t.ProjectStartDate);
                    }
                    enddates.Add(t.ProjectEndDate);

                    startdate = startdates.Min() ?? DateTime.MinValue;
                    enddate = enddates.Max() ?? DateTime.MaxValue;
                }

                //apply a workspace time
                if ((criteria.workwindow ?? 0) > 0 && enddate > DateTime.Now - RECENT && enddate < DateTime.Now + TimeSpan.FromDays(criteria.workwindow ?? 0))
                {
                    enddate = DateTime.Now + TimeSpan.FromDays(criteria.workwindow ?? 0);
                }

                //Alternate date filter between 3 kinds - for now Date Type is not specified
                var datecriteria = $"PO.\"StartDate\" < '{enddate.ToString("yyyy-MM-dd")}' and PO.\"DueDate\" > '{startdate.ToString("yyyy-MM-dd")}'";

                var baselineflatsql = _ppconfig.Value.EnableSubCon ?
                    $"{coreflatsql} WHERE (PL.\"ItemType\" = 290 OR coalesce(OITM.\"U_SubConServiceItem\", 'N') = 'Y') AND (({string.Join(") OR (", revcriteriastrings)})) AND ({datecriteria})" :
                    $"{coreflatsql} WHERE (({string.Join(") OR (", revcriteriastrings)})) AND ({datecriteria})";
                //Rab: Planned records are never returned when the Planned records are not required - this will affect the figures in the resource section
                baselineflatsql += " and PO.\"Status\" <> 'P'";
                var baselinetasks = (await ppdb.FetchAsync<FlatTaskRecord>(baselineflatsql, parms.ToArray())).ToList();

                //Look up calendar info
                //Currently this is grouped by resource by day, warehouse is ignored and SngRunCap is summed
                var capacities = (await ppdb.FetchAsync<ResourcePlanData>(ProdPlanGanttTest5.Code.SQL.GetResourceCapacities, new { startdate, enddate }))
                    .GroupBy(c => new { c.CapDate, c.ResCode, c.WhsCode })
                    .Select(g => new ResourcePlanData() { ResCode = g.Key.ResCode,  WhsCode = g.Key.WhsCode, CapDate = g.Key.CapDate, SngRunCap = g.Sum(c => c.SngRunCap) })
                    .Where(ic => ic.SngRunCap > 0)
                    .ToList();
                //await _ds.filterListHelper(tasks);
                records = tasks;
                return new FlatDataResponse() { tasks = tasks, baselinetasks = baselinetasks, timelinestart = startdate, timelineend = enddate, internalcapacities = capacities };
            }
        }

        public class Patch_PrO
        {
            public int AbsoluteEntry { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? DueDate { get; set; }

            public List<Patch_Line> ProductionOrderLines { get; set; }
            public List<Patch_Stage> ProductionOrdersStages { get; set; }

            public string U_WPPSaved => "Y";
        }
        public class Patch_Line
        {
            public int LineNumber { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }

            public string U_WPPSetup { get; set; } = "{}";
        }

        public class Patch_Stage
        {
            public string StageID { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
        }

        private Client GetSLClient()
        {
            var CM = sp.GetRequiredService<ConnectionPool>();
            var config = sp.GetRequiredService<IOptions<Settings.ConnectionDetails>>();
            var url = config.Value.ServiceLayerURL;
            var companyDb = config.Value.DatabaseName;
            var username = config.Value.UserName;
            var password = config.Value.Password;
            return CM.GetConnection(url, companyDb, username, password);
        }

        [HttpPost("save-prod-ord")]
        public async Task<ActionResult<object>> SaveProdOrd([FromQuery] int DocEntry, [FromBody] List<SavedTaskRecord> Tasks)
        {
            //Permission check
            //Add the permission as a header
            //If the permission is not "Full" return 401 error
            var permission = await GetPermission();
            this.HttpContext.Response.Headers.Add("x-wpp-permission", permission);
            if (!permission.Equals("Full", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(401, "User does not have write access.");
            }

            //1. Group all tasks by StageID
            var stagetasks = Tasks.GroupBy(t => t.StageID);

            //2. For each stage id
            var line_patches = new List<Patch_Line>();
            var stage_patches = new List<Patch_Stage>();
            foreach (var stage in stagetasks)
            {
                if (string.IsNullOrEmpty(stage.Key))
                {
                    //2a. Stage id is null - send update for each operation in stage into Lines
                    line_patches.AddRange(stage.Select(t => new Patch_Line() { LineNumber = t.LineNum, StartDate = t.StartDate.ToLocalTime().DateTime, EndDate = t.EndDate.ToLocalTime().DateTime, U_WPPSetup = t.WPPSetup }));
                } else {
                    //2b. Stage id is not null - send update for this stage into Stages
                    stage_patches.Add(new Patch_Stage() { StageID = stage.Key, StartDate = stage.Min(t => t.StartDate.ToLocalTime().DateTime), EndDate = stage.Max(t => t.EndDate.ToLocalTime().DateTime) });

                    //and also set the config for each line
                    line_patches.AddRange(stage.Select(t => new Patch_Line() { LineNumber = t.LineNum, StartDate = stage.Min(t => t.StartDate.ToLocalTime().DateTime), EndDate = stage.Max(t => t.EndDate.ToLocalTime().DateTime), U_WPPSetup = t.WPPSetup }));
                }
            }

            //3. Where Project is not null
            if (Tasks.Any(t => !string.IsNullOrEmpty(t.Project))) {
                ///TODO - tackle project update later
                
                //3a. Load the project

                //3b. Add code to set the project dates into batch
            }

            //4. Where Sales Order is not null
            if (Tasks.Any(t => t.SODocEntry > 0)) {
                ///TODO - tackle SO update later

                //4a. Load the sales order

                //4b. If the Due date is not sufficient - push it back (or decide on if it's an error)
            }

            //5. Apply all ops in a single batch
            var client = GetSLClient();
            var objectKey = Tasks.First().PODocEntry;
            JObject jPrO = (await client.ProductionOrdersAsync(new List<int> { objectKey }))?.FirstOrDefault();
            var batch = new List<BatchInstruction>();
            if (line_patches.Any() || stage_patches.Any()) {

                //due to how B1 applies PrO Start/Due dates, we need to send a full range of dates
                //for all objects so that we can set the PrO Start/Due

                var payload = jPrO.ToObject<Patch_PrO>();

                if (stage_patches.Any())
                {
                    foreach (var pstage in stage_patches)
                    {
                        var prostage = payload.ProductionOrdersStages.First(l => l.StageID == pstage.StageID);
                        prostage.StartDate = pstage.StartDate;
                        prostage.EndDate = pstage.EndDate.HasValue ? pstage.EndDate.Value : null;
                        if (payload.StartDate > prostage.StartDate)
                        {
                            payload.StartDate = prostage.StartDate;
                        }
                        if (payload.DueDate < prostage.EndDate)
                        {
                            payload.DueDate = prostage.EndDate;
                        }
                    }
                }
                if (line_patches.Any())
                {
                    foreach (var pline in line_patches)
                    {
                        var proline = payload.ProductionOrderLines.First(l => l.LineNumber == pline.LineNumber);
                        proline.StartDate = pline.StartDate;
                        proline.EndDate = pline.EndDate;
                        proline.U_WPPSetup = pline.U_WPPSetup;
                        if (payload.StartDate > proline.StartDate)
                        {
                            payload.StartDate = proline.StartDate;
                        }
                        if (payload.DueDate < proline.EndDate)
                        {
                            payload.DueDate = proline.EndDate;
                        }
                    }
                }

                //TODO - calculate batch instruction for project
                //TODO - calculate batch instruction for sales order
                batch.Add(new BatchInstruction()
                {
                    method = "PATCH",
                    objectName = "ProductionOrders",
                    objectKey = objectKey,
                    payload = payload
                });
            }
            
            if (batch.Any())
            {
                await client.executeChangesetAsync(batch);
            }

            return StatusCode(200, "OK");
        }

        public object GetResourceData(PetaPoco.Database ppdb)
        {
            var ResourceDepts = new List<WebApiResource>();
            var ResourceStaff = new List<WebApiResource>(); // and machines

            var ProjResourceGroups = ppdb.Fetch<ResourceData>(ProdPlanGanttTest5.Code.SQL.GetResourceGroups);
            var ProjResources = ppdb.Fetch<ResourceData>(ProdPlanGanttTest5.Code.SQL.GetResources);

            foreach (var ProjGrp in ProjResourceGroups)
            {
                var Res = new WebApiResource();

                //incorporate an arbitrary "GR-" prefix to put groups in a separate space
                Res.id = $"GR-${ProjGrp.ResGrpCod}";
                //Res.capacity = 8 * 60; //todo
                Res.capacity = 8;
                Res.text = ProjGrp.ResName;

                ResourceStaff.Add(Res);
            }

            foreach (var ProjRes in ProjResources)
            {
                var Res = new WebApiResource();

                Res.id = ProjRes.ResCode;
                //Res.capacity = 8 * 60; //todo
                Res.capacity = 8;
                Res.text = ProjRes.ResName;
                if (ProjRes.ResGrpCod != 0)
                {
                    Res.parent = $"GR-${ProjRes.ResGrpCod}";
                }

                ResourceStaff.Add(Res);
            }

            return new
            {
                //people = ResourceDepts.Concat(ResourceStaff)
                people = ResourceDepts.Concat(ResourceStaff)
            };
        }

        public IEnumerable<ResourcePlanData> GetResourcePlanData()
        {
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                var ProjResourcePlanDatas = ppdb.Fetch<ResourcePlanData>(ProdPlanGanttTest5.Code.SQL.GetResourcePlanDatas);
                return ProjResourcePlanDatas;
            }
        }
        [HttpPost("getSliderData2")]
        public async Task<List<GraphDataPoint>> GetProBarchart(bool incplanned)
        {
            
            List<object> dataSource = new List<object>();
            List<GraphDataPoint> data = new List<GraphDataPoint>();
            List<GraphDataPointRaw> Rawdata = new List<GraphDataPointRaw>();

            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {

                Rawdata = await ppdb.FetchAsync<GraphDataPointRaw>("SELECT OWOR.\"ItemCode\" as \"item\",OWOR.\"StartDate\" as \"StartDate\", OWOR.\"DueDate\" as \"EndDate\" FROM OWOR inner join WOR1  on OWOR.\"DocEntry\" = WOR1.\"DocEntry\" and WOR1.\"ItemType\" = 290 WHERE OWOR.\"Status\" IN ('P','R')");

            }

            var start = new DateTime();
            var end = new DateTime();
            var dates = new List<DateTime>();
            List<DateTime> startDateList = Rawdata.Select(x => x.StartDate).ToList();
            List<DateTime> endDateList = Rawdata.Select(x => x.EndDate).ToList();
            start = startDateList.Min();
            start = DateTimeExtensions.StartOfWeek(start, DayOfWeek.Monday);
            //to make the data from start of the year
            /*            var StartYear = start.Year;
                        var finalStart = "01/01/"+StartYear;
                        start = DateTime.Parse(finalStart);*/
            end = endDateList.Max();
            DateTime dt2 = DateTimeExtensions.StartOfWeek(end, DayOfWeek.Monday);
            end = dt2.AddDays(6);

            var endPlus1 = end.AddDays(1);
            Rawdata.Add(new GraphDataPointRaw { item = "done", StartDate = endPlus1, EndDate = endPlus1 });
            for (var dt = start; dt <= end; dt = dt.AddDays(1))
            {
                data.Add(new GraphDataPoint { theDate = dt, freq = 0 });
            }
            data.Add(new GraphDataPoint { theDate = end.AddDays(1), freq = 0 });
            for (var i = 0; i < Rawdata.Count; i++)
            {
                var sd = Rawdata[i].StartDate;
                var ed = Rawdata[i].EndDate;

                int sdi = (sd - start).Days;
                int edi = (ed - start).Days;

                for (var q = sdi; q <= edi; q++)
                {
                    //var datetochk = data[q].theDate;

                    //if (datetochk >= sd && datetochk <= ed)
                    //{

                    data[q].freq = data[q].freq + 1;
                    //}
                    //else { break; }
                }


            }


            data.RemoveAll(r => r.theDate == endPlus1);

            return data.ToList();


        }
        // GET api/data
        [HttpGet("resources")]
        public object GetResources() {
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
               return GetResourceData(ppdb);
            }
        }
     
 
        [HttpPost("getSliderData")]
        public async Task<List<GraphDataPoint>> GetItems()
        {
            
            return await _ds.GetProBarchart();
        }
        [HttpPost("getSliderData3")]
        public async Task<List<GraphDataPoint>> GetItems2()
        {

            return await _ds.GetProBarchart2();
        }

        [HttpPost("getBPData")]
        public async Task<List<string>> GetBPs()
        {
            return await _ds.GetBPdata();
        }

        [HttpPost("getPNData")]
        public async Task<List<string>> GetPNs()
        {
            return await _ds.GetPNdata();
        }

        [HttpPost("getSOData")]
        public async Task<List<int>> GetSOs()
        {
            return await _ds.GetSOdata();
        }

        [HttpPost("getDBName")]
        public async Task<List<string>> GetDBN()
        {
            return await _ds.GetDBName();
        }

        [HttpGet("getFilteredData")]
        [HttpPost("getFilteredData")]
        public async Task<ActionResult<List<filterDataList>>> GetFilteredData()
        {
            if (records == null)
            {
                return StatusCode((int)System.Net.HttpStatusCode.NotFound);
            }
            return await _ds.GetFilteredData(records);
        }
        [HttpGet("getFilteredData2")]
        [HttpPost("getFilteredData2")]
        public async Task<ActionResult<List<BPDataPoint>>> GetFilteredData2([FromBody] dynamic body)
        {
            var start = body.startd.ToString();
            var end = body.endd.ToString();
            if (records == null)
            {
                return StatusCode((int)System.Net.HttpStatusCode.NotFound);
            }
            var query = $@"select DISTINCT PO.""CardCode"" as ""BPCode"", OCRD.""CardName"" AS ""BPDesc"" from OWOR PO  left join OCRD on PO.""CardCode"" = OCRD.""CardCode"" WHERE(PO.""Status"" in ('P', 'L')) AND(PO.""StartDate"" < '" + end + "' and PO.\"DueDate\" > '" + start + "') and PO.\"CardCode\" is not null";
            List<BPDataPoint> baselinetasks = new List<BPDataPoint> ();
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                 baselinetasks = await ppdb.FetchAsync<BPDataPoint>(query);
            }
            return baselinetasks;
        }

    }
}