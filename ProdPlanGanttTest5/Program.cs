using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NLog;
using NLog.Web;

namespace ProdPlanGanttTest5
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
            
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    //Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(@"Mgo+DSMBaFt/QHJqVVhkX1pFdEBBXHxAd1p/VWJYdVt5flBPcDwsT3RfQF9iSX5Xd0VnXHtfcXBQQw==;Mgo+DSMBPh8sVXJ0S0R+XE9AdVRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS3xSdkVnWH9adXBURGFUVA==;ORg4AjUWIQA/Gnt2VVhiQlFaclxJXGFWfVJpTGpQdk5xdV9DaVZUTWY/P1ZhSXxRd0VjXX5edHFRR2JfUEE=;NzMxMjczQDMyMzAyZTMyMmUzMEI4Q05SUEJVVzlHYzNZbTNtaExVcEVnOFhuQnFqYnFlZExjVDlCSkVFRWc9;NzMxMjc0QDMyMzAyZTMyMmUzMFlqUWtuYjdmMkJ6cUIvVlJKNElSbzkwakx0MlBQdzE0U3BLN3BnelBxa1E9;NRAiBiAaIQQuGjN/V0Z+Xk9EaFtBVmJLYVB3WmpQdldgdVRMZVVbQX9PIiBoS35RdERjWXtfcHBQQmFeWEBz;NzMxMjc2QDMyMzAyZTMyMmUzMGljRjc0M1hWT3pTZWVsMlN1cWZuZ29hS0RrQUVqTDAyZ0R4WG9YeHdrNFk9;NzMxMjc3QDMyMzAyZTMyMmUzMEFwZVJ2U1hwUWo3UjRHM3VydDlkWFpjZS8yMnhlLzM5ZDV1R0F1SHl0QjA9;Mgo+DSMBMAY9C3t2VVhiQlFaclxJXGFWfVJpTGpQdk5xdV9DaVZUTWY/P1ZhSXxRd0VjXX5edHFRR2NaUEE=;NzMxMjc5QDMyMzAyZTMyMmUzMGFrUWZLUzhkb3pjb3BYQ3dPOTN4czd6ZUhDZS9jUjkrWGJWT0ZIVHpjQjg9;NzMxMjgwQDMyMzAyZTMyMmUzMGJBbkNldVF3V2FRaVZuL29JSlRFUEJhYzN0QW1HOGU1bzhtWWNzQ0lONGc9;NzMxMjgxQDMyMzAyZTMyMmUzMGljRjc0M1hWT3pTZWVsMlN1cWZuZ29hS0RrQUVqTDAyZ0R4WG9YeHdrNFk9");

                    webBuilder.UseStartup<Startup>();
                })
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Trace);
                })
                .UseNLog();
    }
}
