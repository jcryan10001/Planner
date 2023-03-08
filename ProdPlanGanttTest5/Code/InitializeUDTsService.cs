using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Linq;
using ProdPlanGanttTest5.Models;
using SAPB1Commons.ServiceLayer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Task = System.Threading.Tasks.Task;
using System.Net;

namespace ProdPlanGanttTest5.Code
{
    public class InitializeUDTsService : IHostedService
    {
        private readonly UserDBConfig _dbconf;
        private readonly ILogger<InitializeUDTsService> _logger;
        private ConnectionPool _CM;
        private readonly IOptions<Settings.ConnectionDetails> _SLConnectionDetails;

        //The Ready Event will only be set when UDT/UDF config is observed in the database
        public ManualResetEventSlim Ready = new ManualResetEventSlim(false);

        public InitializeUDTsService(ILogger<InitializeUDTsService> logger, ConnectionPool CM, UserDBConfig config, IOptions<Settings.ConnectionDetails> SLConnectionDetails)
        {
            this._dbconf = config;
            this._logger = logger;
            this._CM = CM;
            this._SLConnectionDetails = SLConnectionDetails;
        }

        private Client GetSLClient()
        {
            var CM = _CM;
            var config = _SLConnectionDetails;
            var url = config.Value.ServiceLayerURL;
            var companyDb = config.Value.DatabaseName;
            var username = config.Value.UserName;
            var password = config.Value.Password;
            return CM.GetConnection(url, companyDb, username, password);
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Task.Run(async () =>
            {
                _logger.LogInformation("InitializeUDTsService: Creating Service Layer Client");
                var client = GetSLClient();

                var AnyErrors = true;
                while (AnyErrors)
                {
                    AnyErrors = false;

                    if (_dbconf.RequiredTables?.Any() ?? false)
                    {
                        _logger.LogInformation($"InitializeUDTsService: {_dbconf.RequiredTables?.Count()} tables(s) to check.");

                        foreach (var table in _dbconf.RequiredTables)
                        {
                            if (cancellationToken.IsCancellationRequested)
                            {
                                _logger.LogInformation($"InitializeUDTsService: Cancel Requested, Returning");
                                return;
                            }
                            _logger.LogInformation($"InitializeUDTsService: Considering table {table.table}");
                            bool tablepresent = false;
                            try
                            {
                                var ins = new BatchInstruction();
                                ins.method = "GET";
                                ins.objectName = $"UserTablesMD?$filter=TableName eq '{table.table}'";
                                var sfieldinfo = await client.executeSingleAsync(ins, false);
                                var jfieldinfo = JObject.Parse(sfieldinfo);
                                tablepresent = ((JArray)jfieldinfo["value"])?.Count != 0;
                            }
                            catch (WebException wex)
                            {
                                if (wex.Status == WebExceptionStatus.ProtocolError)
                                {
                                    var resp = wex.Response as HttpWebResponse;
                                    if (resp == null || resp.StatusCode != HttpStatusCode.NotFound)
                                    {
                                        //Service layer can be weird when creating table - slow down, give it some time
                                        await Task.Delay(1000);
                                        AnyErrors = true;
                                        continue;
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError($"InitializeUDTsService: Checking table {table.table}", ex);
                                //Service layer can be weird when creating table - slow down, give it some time
                                await Task.Delay(1000);
                                AnyErrors = true;
                                continue;
                            }
                            _logger.LogInformation($"InitializeUDTsService: Table {table.table}");
                            if (!tablepresent)
                            {
                                try
                                {
                                    await client.executeSingleAsync(BatchInstruction.InsertUDTMD(table.table, table.description));
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError($"InitializeUDTsService: Creating table {table.table}", ex);
                                    //Service layer can be weird when creating field - slow down, give it some time
                                    await Task.Delay(1000);
                                    AnyErrors = true;
                                }
                            }
                        }
                    }

                    if (_dbconf.RequiredFields?.Any() ?? false)
                    {
                        _logger.LogInformation($"InitializeUDTsService: {_dbconf.RequiredFields?.Count()} field(s) to check.");

                        foreach (var field in _dbconf.RequiredFields)
                        {
                            if (cancellationToken.IsCancellationRequested)
                            {
                                _logger.LogInformation($"InitializeUDTsService: Cancel Requested, Returning");
                                return;
                            }
                            _logger.LogInformation($"InitializeUDTsService: Considering field {field.field} on table {field.table}");
                            bool fieldpresent = false;
                            try
                            {
                                var ins = new BatchInstruction();
                                ins.method = "GET";
                                ins.objectName = $"UserFieldsMD?$filter=TableName eq '{field.table}' and Name eq '{field.field}'";
                                var sfieldinfo = await client.executeSingleAsync(ins, false);
                                var jfieldinfo = JObject.Parse(sfieldinfo);
                                fieldpresent = ((JArray)jfieldinfo["value"])?.Any() ?? false;
                            }
                            catch (WebException wex)
                            {
                                if (wex.Status == WebExceptionStatus.ProtocolError)
                                {
                                    var resp = wex.Response as HttpWebResponse;
                                    if (resp == null || resp.StatusCode != HttpStatusCode.NotFound)
                                    {
                                        //Service layer can be weird when creating table - slow down, give it some time
                                        await Task.Delay(1000);
                                        AnyErrors = true;
                                        continue;
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError($"InitializeUDTsService: Checking field {field.field} on table {field.table}", ex);
                                //Service layer can be weird when creating field - slow down, give it some time
                                await Task.Delay(1000);
                                AnyErrors = true;
                                continue;
                            }
                            _logger.LogInformation($"InitializeUDTsService: Field {field.field} on table {field.table}, found = {fieldpresent}");
                            if (!fieldpresent)
                            {
                                try
                                {
                                    await client.executeSingleAsync(BatchInstruction.InsertUDFMD(field, false));
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError($"InitializeUDTsService: Creating field {field.field} on table {field.table}", ex);
                                    //Service layer can be weird when creating field - slow down, give it some time
                                    await Task.Delay(1000);
                                    AnyErrors = true;
                                }
                            }
                        }
                    }

                    //Install OchAppCfgs
                    if (_dbconf.RequiredOchAppCfgSettings?.Any() ?? false)
                    {
                        var sochappcfgs = await client.GetAsync("U_OCHAPPCFG", odatamaxpagesize: 5000);
                        var jochappcfgs = JObject.Parse(sochappcfgs);
                        var existing = jochappcfgs.ToObject<ODataOchAppCfgWrapper>()?.value;
                        var nextid = (existing.Max(s =>
                        {
                            int x;
                            int? v = (int.TryParse(s.Code, out x) ? x : null);
                            return v;
                        }) ?? 999) + 1;
                        var adding = _dbconf.RequiredOchAppCfgSettings.Select(s => s.progid)
                            .Except(existing.Select(s => s.U_ProgID));
                        foreach (var a in adding)
                        {
                            var config = _dbconf.RequiredOchAppCfgSettings.First(s => s.progid == a);

                            _logger.LogInformation($"InitializeUDTsService: Creating OchAppCfg setting {config.progid}");
                            var body = new OchAppCfg(config);
                            body.Code = $"{nextid}";
                            body.Name = $"{nextid}";
                            nextid++;

                            try
                            {
                                await client.executeSingleAsync(new BatchInstruction()
                                {
                                    objectName = "U_OCHAPPCFG",
                                    method = "POST",
                                    payload = body
                                });
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError($"InitializeUDTsService: Error creating OchAppCfg setting {config.progid}", ex);
                                //Service layer can be weird when creating field - slow down, give it some time
                                await Task.Delay(1000);
                                AnyErrors = true;
                            }
                        }
                    }

                    if (AnyErrors)
                    {
                        //Service layer can be weird when creating field - slow down, give it some time
                        await Task.Delay(10000);
                    }
                }
                _logger.LogInformation($"InitializeUDTsService: Complete.");
            }, cancellationToken)
                .ContinueWith((T) => {
                    _logger.LogError(T.Exception, "Fault in InitializeUDTsService");
                }, System.Threading.Tasks.TaskContinuationOptions.OnlyOnFaulted);

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            //TODO: stop gracefully
            return Task.Delay(1);
        }

        private class OchAppCfg
        {
            public OchAppCfg() { }
            public OchAppCfg(OchAppCfgSetting st)
            {
                U_ProgID = st.progid;
                U_Module = st.module;
                U_Type = st.type;
                U_Description = st.description;
                U_Delimiter = st.delimiter;
                U_Query = st.query;
                U_ConfigData = st.configdata;
                U_ExtConfigData = st.extconfigdata;
                U_Forms = st.forms;
            }
            public string Code { get; set; }
            public string Name { get; set; }
            public string U_ProgID { get; set; }
            public string U_Module { get; set; }
            public string U_Type { get; set; }
            public string U_Description { get; set; }
            public string U_Delimiter { get; set; }

            public string U_Query { get; set; }
            public string U_ConfigData { get; set; }
            public string U_ExtConfigData { get; set; }
            public string U_Forms { get; set; }
        }

        private class ODataOchAppCfgWrapper
        {
            public List<OchAppCfg> value { get; set; }
        }
    }
}
