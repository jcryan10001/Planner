using DHX.Gantt.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using ProdPlanGanttTest5.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace ProdPlanGanttTest5.Controllers
{
    [Authorize]
    [AllowAnonymous]
    public class HomeController : Controller
    {
        
        private readonly ILogger<HomeController> _logger;
        private readonly ILogger<ClientLogError> _clientlogger;
        PetaPoco.IDatabaseBuildConfiguration databaseConfig;
        private IServiceProvider _sp;
        private bool IsHana { get; set; }

        public HomeController(ILogger<HomeController> logger, ILogger<ClientLogError> clientlogger, IOptions<Settings.ConnectionDetails> config, IServiceProvider sp)
        {
            _logger = logger;
            _clientlogger = clientlogger;

            SAPB1Commons.B1Types.DatabaseType DBServerType;
            IsHana = config.Value.DBType.ToUpper() == "HANA";
            if (config.Value.DBType.ToUpper() == "HANA")
            {
                DBServerType = SAPB1Commons.B1Types.DatabaseType.Hana;
            }
            else
            {
                DBServerType = SAPB1Commons.B1Types.DatabaseType.MsSql;
            };

            var conf = new SAPB1Commons.B1Types.B1DirectDBProfile() { DatabaseName = config.Value.DatabaseName, DBPassword = config.Value.DBPassword, DBServerName = config.Value.DBServerName, DBType = DBServerType, DBUserName = config.Value.DBUserName, ServiceLayerURL = config.Value.ServiceLayerURL, DBTenantName = config.Value.DBTenantName };
            databaseConfig = SAPB1Commons.PetaPocoConnectionBuilder.BuildSAPBusinessOneConfigForPetaPoco(conf);

            _sp = sp;
        }

        public partial class DialogController : Controller
        {
            public IActionResult CustomDialogs()
            {
                return View();
            }
        }
        public IEnumerable<ResourcePlanData> GetResourcePlanData()
        {
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                var ProjResourcePlanDatas = ppdb.Fetch<ResourcePlanData>(ProdPlanGanttTest5.Code.SQL.GetResourcePlanDatas);
                return ProjResourcePlanDatas;
            }
        }

        private async Task<bool> SetPreference(string keyname, [FromBody] dynamic value)
        {
            if (!User.Identity.IsAuthenticated)
            {
                return false;
            }
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                var userkey = $"{User.Identity.Name}.{keyname}";
                var JsonVal = JToken.FromObject(value);
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
                    await ppdb.ExecuteAsync(query, new { UserKey = userkey, ItemType = "WebProdPlan/Gantt", Json = JsonStr, Created = DateTime.Now, Updated = DateTime.Now, });
                }
                return true;
            }
        }

        private async Task<bool> HasPreference(string keyname)
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

        private async Task<dynamic> GetPreference(string keyname)
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

        public async Task<IActionResult> Index()
        {
            var model = new PlannerViewModel();
            model.ResourcePlanData = GetResourcePlanData();

            model.criteria.postatus = (await GetPreference("Criteria.postatus")) ?? "P";

            return View(model);
        }

        [HttpGet("edit")]
        public IActionResult Edit()
        {
            var model = new PlannerViewModel();
            model.ResourcePlanData = GetResourcePlanData();

            return View("Index", model);
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
        public IActionResult DefaultFunctionalities()
        {
            var model = new PlannerViewModel();
            model.cellSpacing = new double[] { 10, 10 };

            return View(model);
        }
        public IActionResult Log([FromBody] ClientLogErrorRequest logs)
        {
            if (logs?.logs?.Any() ?? false)
            {
                foreach (var log in logs.logs)
                {
                    switch (log.level?.ToUpper())
                    {
                        case "TRACE":
                            if (!string.IsNullOrWhiteSpace(log.stacktrace))
                            {
                                _clientlogger.LogTrace($"{log.message}: {log.stacktrace}");
                            }
                            else
                            {
                                _clientlogger.LogTrace($"{log.message}");
                            }
                            break;
                        case "DEBUG":
                            if (!string.IsNullOrWhiteSpace(log.stacktrace))
                            {
                                _clientlogger.LogDebug($"{log.message}: {log.stacktrace}");
                            }
                            else
                            {
                                _clientlogger.LogDebug($"{log.message}");
                            }
                            break;
                        case "WARN":
                        case "WARNING":
                            if (!string.IsNullOrWhiteSpace(log.stacktrace))
                            {
                                _clientlogger.LogWarning($"{log.message}: {log.stacktrace}");
                            }
                            else
                            {
                                _clientlogger.LogWarning($"{log.message}");
                            }
                            break;
                        case "ERROR":
                            if (!string.IsNullOrWhiteSpace(log.stacktrace))
                            {
                                _clientlogger.LogError($"{log.message}: {log.stacktrace}");
                            }
                            else
                            {
                                _clientlogger.LogError($"{log.message}");
                            }
                            break;
                        default:
                            if (!string.IsNullOrWhiteSpace(log.stacktrace))
                            {
                                _clientlogger.LogInformation($"{log.message}: {log.stacktrace}");
                            }
                            else {
                                _clientlogger.LogInformation($"{log.message}");
                            }
                            break;
                    }
                }
            }

            return Ok();
        }
    }
}

