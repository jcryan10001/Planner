using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProdPlanGanttTest5.Code;
using ProdPlanGanttTest5.Models;
using SAPB1Commons.ServiceLayer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NLog;
using NLog.Web;
using NLog.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.Cookies;
using Task = System.Threading.Tasks.Task;
using System.Net;
using Microsoft.AspNetCore.Mvc.Formatters;
using Newtonsoft.Json.Serialization;
using ProdPlanGanttTest5.Services;

namespace ProdPlanGanttTest5
{
    public class Startup
    {
        private Microsoft.Extensions.Logging.ILogger _logger;

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var nlogLoggerProvider = new NLogLoggerProvider();
            _logger = nlogLoggerProvider.CreateLogger(typeof(Startup).FullName);

            services.AddControllersWithViews(opt => {
                opt.OutputFormatters.RemoveType<HttpNoContentOutputFormatter>();
            }).AddJsonOptions(opt =>
            {
                opt.JsonSerializerOptions.PropertyNamingPolicy = null;
            }).AddNewtonsoftJson(options => {
                options.SerializerSettings.ContractResolver = new DefaultContractResolver()
                {
                    NamingStrategy = null
                };
            }).AddControllersAsServices();

            services.Configure<Settings.ConnectionDetails>(Configuration.GetSection("ConnectionDetails"));
            services.Configure<Settings.ProductionPlannerSettings>(Configuration.GetSection("ProductionPlanner"));

            services.AddTransient<Client>();
            services.AddSingleton<ConnectionPool>();

            services.AddTransient<UserDBConfig>(s => new UserDBConfig()
            {
                RequiredTables= new List<UDTConfig>()
                {
                    new UDTConfig() {
                        table="OCH_USERPREFS",
                        description="Cache of User Preferences",
                        autoinc=false
                    }
                },
                RequiredFields = new List<UDFConfig>() {
                    new UDFConfig() {
                        table="@OCH_USERPREFS",
                        field="UserKey",
                        description="Combined {UserCode}.{Setting} for the ItemType",
                        type=UDFConfig.db_Alpha,
                        size=254
                    },
                    new UDFConfig() {
                        table="@OCH_USERPREFS",
                        field="ItemType",
                        description="Combined {Product}/{Feature} key",
                        type=UDFConfig.db_Alpha,
                        size=50
                    },
                    new UDFConfig() {
                        table="@OCH_USERPREFS",
                        field="Json",
                        description="Serialised value of object",
                        type=UDFConfig.db_Memo,
                        size=65535
                    },
                    new UDFConfig() {
                        table="@OCH_USERPREFS",
                        field="Created",
                        description="Date that data was created",
                        type=UDFConfig.db_Date,
                        size=10
                    },
                    new UDFConfig() {
                        table="@OCH_USERPREFS",
                        field="Updated",
                        description="Date that data was updated",
                        type=UDFConfig.db_Date,
                        size=10
                    },

                    new UDFConfig() {
                    table="OWOR",
                    field="WPPSaved",
                    description="Saved from Web Production Planner? Y/N",
                    type=UDFConfig.db_Alpha,
                    size=1
                    },
                    new UDFConfig() {
                    table="WOR1",
                    field="WPPSetup",
                    description="Production Planner Task Setup",
                    type=UDFConfig.db_Memo
                    },
                    new UDFConfig() {
                    table="OUSR",
                    field="WPPPermission",
                    description="User Permission, Prod Planner (Default/None/Read Only/Full)",
                    type=UDFConfig.db_Alpha,
                    size=10
                    }
                },
                RequiredOchAppCfgSettings = new List<OchAppCfgSetting>() {
                    new OchAppCfgSetting() {
                        progid = "WPPDefaultPermission",
                        description = "Default User Permission, Prod Planner (None/Read Only/Full)",
                        configdata = ""
                    }
                }
            });
            services.AddHostedService<InitializeUDTsService>();

            services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(config => {
                    config.ExpireTimeSpan = TimeSpan.FromHours(8);
                    config.SlidingExpiration = true;
                    config.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = ctx =>
                        {
                            if (ctx.Request.Path.StartsWithSegments("/api"))
                            {
                                ctx.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                            }
                            else
                            {
                                ctx.Response.Redirect(ctx.RedirectUri);
                            }
                            return Task.FromResult(0);
                        },
                        OnSigningIn = ctx =>
                        {
                            return Task.FromResult(0);
                        }
                    };
                });

            services.AddDistributedMemoryCache();

            services.AddSession(options => {
                options.IdleTimeout = TimeSpan.FromHours(2);
            });
            services.AddSingleton<DataService>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(@"Mgo+DSMBaFt/QHJqVVhkX1pFdEBBXHxAd1p/VWJYdVt5flBPcDwsT3RfQF9iSX5Xd0VnXHtfcXBQQw==;Mgo+DSMBPh8sVXJ0S0R+XE9AdVRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS3xSdkVnWH9adXBURGFUVA==;ORg4AjUWIQA/Gnt2VVhiQlFaclxJXGFWfVJpTGpQdk5xdV9DaVZUTWY/P1ZhSXxRd0VjXX5edHFRR2JfUEE=;NzMxMjczQDMyMzAyZTMyMmUzMEI4Q05SUEJVVzlHYzNZbTNtaExVcEVnOFhuQnFqYnFlZExjVDlCSkVFRWc9;NzMxMjc0QDMyMzAyZTMyMmUzMFlqUWtuYjdmMkJ6cUIvVlJKNElSbzkwakx0MlBQdzE0U3BLN3BnelBxa1E9;NRAiBiAaIQQuGjN/V0Z+Xk9EaFtBVmJLYVB3WmpQdldgdVRMZVVbQX9PIiBoS35RdERjWXtfcHBQQmFeWEBz;NzMxMjc2QDMyMzAyZTMyMmUzMGljRjc0M1hWT3pTZWVsMlN1cWZuZ29hS0RrQUVqTDAyZ0R4WG9YeHdrNFk9;NzMxMjc3QDMyMzAyZTMyMmUzMEFwZVJ2U1hwUWo3UjRHM3VydDlkWFpjZS8yMnhlLzM5ZDV1R0F1SHl0QjA9;Mgo+DSMBMAY9C3t2VVhiQlFaclxJXGFWfVJpTGpQdk5xdV9DaVZUTWY/P1ZhSXxRd0VjXX5edHFRR2NaUEE=;NzMxMjc5QDMyMzAyZTMyMmUzMGFrUWZLUzhkb3pjb3BYQ3dPOTN4czd6ZUhDZS9jUjkrWGJWT0ZIVHpjQjg9;NzMxMjgwQDMyMzAyZTMyMmUzMGJBbkNldVF3V2FRaVZuL29JSlRFUEJhYzN0QW1HOGU1bzhtWWNzQ0lONGc9;NzMxMjgxQDMyMzAyZTMyMmUzMGljRjc0M1hWT3pTZWVsMlN1cWZuZ29hS0RrQUVqTDAyZ0R4WG9YeHdrNFk9");
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseCookiePolicy();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseMiddleware<ErrorHandlerMiddleware>();

            app.UseSession();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
