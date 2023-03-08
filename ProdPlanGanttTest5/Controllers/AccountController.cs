using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SAPB1Commons.ServiceLayer;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using static ProdPlanGanttTest5.Models.Settings;
using SL = SAPB1Commons.ServiceLayer;

namespace RentalsApp.Server.Controllers
{
    [Route("api/account")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private ILogger<AccountController> _logger;
        private IOptions<ConnectionDetails> _ConnectionDetails;
        private ConnectionPool _CM;
        PetaPoco.IDatabaseBuildConfiguration databaseConfig;

        private bool IsHana { get; set; }

        public AccountController(ILogger<AccountController> logger, IOptions<ConnectionDetails> connectionDetails, SL.ConnectionPool CM, IOptions<ProdPlanGanttTest5.Models.Settings.ConnectionDetails> config)
        {
            _logger = logger;
            _ConnectionDetails = connectionDetails;
            _CM = CM;

            IsHana = config.Value.DBType.ToUpper() == "HANA";

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

        public class Credentials
        {
            public string Username { get; set; }
            public string Password { get; set; }    
        }

        private SL.Client GetSLClient(string username, string password)
        {
            _logger.LogInformation("Creating Service Layer Client");
            var CM = _CM;
            var config = _ConnectionDetails;
            var url = config.Value.ServiceLayerURL;
            var companyDb = config.Value.DatabaseName;
            return CM.GetConnection(url, companyDb, username, password, true);
        }

        [HttpPost("login")]
        public async Task<bool> Login([FromBody]Credentials credentials)
        {
            //check the credentials by logging in to service layer
            SL.Client client = null;
            try
            {
                 client = GetSLClient(credentials.Username, credentials.Password);
            } catch (ServiceLayerSecurityException)
            {
                //we're actively looking for the security exception - this suggests that login failed
                await HttpContext.SignOutAsync();
                return false;
            }

            if (client == null)
            {
                await HttpContext.SignOutAsync();
                return false;
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

                var permission = await ppdb.ExecuteScalarAsync<string>(query, new { Username = credentials.Username });
                if (permission.Equals("NONE", System.StringComparison.OrdinalIgnoreCase))
                {
                    await HttpContext.SignOutAsync();
                    return false;
                }

                this.HttpContext.Response.Headers.Add("x-wpp-permission", permission);
            }

            //test - presume that we have logged in and do the signin
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, credentials.Username),
                new Claim(ClaimTypes.Role, "User")
            };

            //, new Claim("ServiceLayer", Password)

            var ClaimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true
            };
            
            HttpContext.Session.SetString("ServiceLayer", credentials.Password);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(ClaimsIdentity),
                authProperties
                );

            return true;
        }

        [Authorize]
        [HttpGet("username")]
        public Task<string> GetUsername() {
            return Task.FromResult(User.Identity.Name);
        }
        [HttpPost("logout")]
        public async void LogOut()
        {
           await HttpContext.SignOutAsync();
        }
    }
}
