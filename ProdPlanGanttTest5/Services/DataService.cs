using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProdPlanGanttTest5.Models;
using Task = System.Threading.Tasks.Task;

namespace ProdPlanGanttTest5.Services
{
    public static class DateTimeExtensions
    {
        public static DateTime StartOfWeek(this DateTime dt, DayOfWeek startOfWeek)
        {
            int diff = (7 + (dt.DayOfWeek - startOfWeek)) % 7;
            return dt.AddDays(-1 * diff).Date;
        }
    }
    public class DataService
    {
        private PetaPoco.IDatabaseBuildConfiguration databaseConfig;
        //private List<FlatTaskRecord> records;
        public DataService(ILogger<DataService> logger, IOptions<Settings.ConnectionDetails> config)
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
        }

        public bool IsHana { get; }


        //public async Task<List<FlatTaskRecord>> filterListHelper(List<FlatTaskRecord> recievedRecords)
        //{
        //    records = recievedRecords;
        //    return recievedRecords.ToList();
        //}

        static Task<bool> TaskFromWaitHandle(WaitHandle mre, int timeout, CancellationToken ct)
        {
            return Task.Run(() =>
            {
                bool s = WaitHandle.WaitAny(new WaitHandle[] { mre, ct.WaitHandle }, timeout) == 0;
                ct.ThrowIfCancellationRequested();
                return s;
            }, ct);
        }

        public async Task<List<filterDataList>> GetFilteredData(List<FlatTaskRecord> records)
        {
            List<filterDataList> data = new List<filterDataList>();

            if (records != null)
            {
                foreach (var flatTask in records)
                {
                    filterDataList item;
                    var bp = flatTask.POCardCode;
                    var pn = flatTask.Project;
                    int so = flatTask.SODocNum;
                    int po = flatTask.PODocNum;
                    DateTime startd = flatTask.StartDate;
                    DateTime endd = flatTask.EndDate;
                    var BPD = flatTask.BPDescription;
                    var POD = flatTask.PODescription;
                    var PND = flatTask.PNDescription;
                    var ITMD = flatTask.ItemDescription;
                    var itm = flatTask.POItemCode;


                    item = new filterDataList { BP = bp, PN = pn, SO = so, PO = po, startDate = startd, endDate = endd, BPDesc = BPD, PODesc=POD, PNDesc = PND,ItemDesc = ITMD, Item = itm };

                    data.Add(item);
                };
            }

            return data;
        }


/*        public async Task<List<BPDataPoint>> GetFilteredData2(List<string> records)
        {
            List<BPDataPoint> data = records;
            return data;
        }*/


        public async Task<List<GraphDataPoint>> GetProBarchart()
        {
            bool includePlanned = false;
            List<object> dataSource = new List<object>();
            List<GraphDataPoint> data = new List<GraphDataPoint>();
            List<GraphDataPointRaw> Rawdata = new List<GraphDataPointRaw>();
 
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                
              Rawdata = await ppdb.FetchAsync<GraphDataPointRaw>("SELECT OWOR.\"ItemCode\" as \"item\",OWOR.\"StartDate\" as \"StartDate\", OWOR.\"DueDate\" as \"EndDate\" FROM OWOR inner join WOR1  on OWOR.\"DocEntry\" = WOR1.\"DocEntry\" and WOR1.\"ItemType\" = 290 WHERE OWOR.\"Status\" = 'R'");

            }

            var start = new DateTime();
            var end = new DateTime();
            var dates = new List<DateTime>();
            List<DateTime> startDateList = Rawdata.Select(x => x.StartDate).ToList();
            List<DateTime> endDateList = Rawdata.Select(x => x.EndDate).ToList();
            start = startDateList.Any() ? startDateList.Min() : DateTime.Today.AddDays(-14);
            start = DateTimeExtensions.StartOfWeek(start,DayOfWeek.Monday);
            //to make the data from start of the year
            /*            var StartYear = start.Year;
                        var finalStart = "01/01/"+StartYear;
                        start = DateTime.Parse(finalStart);*/
            end = endDateList.Any() ? endDateList.Max() : DateTime.Today.AddDays(60);
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
        public async Task<List<GraphDataPoint>> GetProBarchart2()
        {
            bool includePlanned = false;
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
            start = startDateList.Any() ? startDateList.Min() : DateTime.Today.AddDays(-14);
            start = DateTimeExtensions.StartOfWeek(start, DayOfWeek.Monday);
            //to make the data from start of the year
            /*            var StartYear = start.Year;
                        var finalStart = "01/01/"+StartYear;
                        start = DateTime.Parse(finalStart);*/
            end = endDateList.Any() ? endDateList.Max() : DateTime.Today.AddDays(60);
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

        public async Task<List<string>> GetBPdata()
        {
            List<string> data = null;
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                using (var scope = ppdb.GetTransaction())
                {

                    data = await ppdb.FetchAsync<string>("SELECT CardCode FROM OWOR");
                   
                }
                return data.ToList();
            }

        }
        public async Task<List<string>> GetPNdata()
        {
            List<string> data = null;
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                using (var scope = ppdb.GetTransaction())
                {

                    data = await ppdb.FetchAsync<string>("  SELECT Project from OWOR WHERE Project is NOT NULL AND Project <> ''");

                }
                return data.ToList();
            }

        }
        public async Task<List<int>> GetSOdata()
        {
            List<int> data = null;
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                using (var scope = ppdb.GetTransaction())
                {

                    data = await ppdb.FetchAsync<int>("  SELECT OriginNum from OWOR WHERE OriginNum is NOT NULL AND OriginNum <> ''");

                }
                return data.ToList();
            }

        }
        public async Task<List<string>> GetDBName()
        {
            List<string> data = null;
            using (var ppdb = new PetaPoco.Database(databaseConfig))
            {
                using (var scope = ppdb.GetTransaction())
                {

                    data = await ppdb.FetchAsync<string>("select \"CompnyName\" from OADM");

                }
                return data.ToList();
            }

        }

    }
}
