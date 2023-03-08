using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using PetaPoco;

namespace SAPB1Commons
{
    public class PetaPocoConnectionBuilder
    {
        //private static string SapDataHana45DLLFilename = "Sap.Data.Hana.v4.5.dll";
        //private static bool? _LoadedNet45Provider = null;

        //public static bool InitialiseSapDataHanaCore45Provider()
        //{
        //    if (_LoadedNet45Provider.HasValue) return _LoadedNet45Provider.Value;

        //    _LoadedNet45Provider = false;

        //    var logger = NLog.LogManager.GetCurrentClassLogger();

        //    var Net45DLLPath = System.IO.Path.Combine(Environment.CurrentDirectory, SapDataHana45DLLFilename);

        //    if (System.IO.File.Exists(Net45DLLPath))
        //    {
        //        logger.Trace("Attempting to load assembly " + Net45DLLPath);

        //        System.Reflection.Assembly.LoadFile(Net45DLLPath);
        //        _LoadedNet45Provider = true;
        //    }
        //    else
        //    {
        //        logger.Trace("Did not find " + Net45DLLPath);

        //        Net45DLLPath = System.IO.Path.Combine(Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location), SapDataHana45DLLFilename);

        //        if (System.IO.File.Exists(Net45DLLPath))
        //        {
        //            logger.Trace("Attempting to load assembly " + Net45DLLPath);

        //            System.Reflection.Assembly.LoadFile(Net45DLLPath);
        //            _LoadedNet45Provider = true;
        //        }
        //        else
        //        {
        //            logger.Trace("Did not find " + Net45DLLPath);

        //            Net45DLLPath = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "sap\\hdbclient\\ado.net\\v4.5", SapDataHana45DLLFilename);

        //            if (System.IO.File.Exists(Net45DLLPath))
        //            {
        //                logger.Trace("Attempting to load assembly " + Net45DLLPath);

        //                System.Reflection.Assembly.LoadFile(Net45DLLPath);
        //                _LoadedNet45Provider = true;
        //            }
        //            else
        //            {
        //                logger.Trace("Did not find " + Net45DLLPath);
        //            }
        //        }
        //    }

        //    logger.Info("_LoadedNet45Provider = " + _LoadedNet45Provider.ToString());

        //    return _LoadedNet45Provider.Value;
        //}

        public static PetaPoco.IDatabaseBuildConfiguration BuildSAPBusinessOneConfigForPetaPoco(SAPB1Commons.B1Types.B1DirectDBProfile Profile)
        {

            if (Profile.DBType == SAPB1Commons.B1Types.DatabaseType.Hana)
            {
                if (true)   //isDotNetCoreClient
                {
                    //use the SAP netcore provider for Hana 2+

                    //The underlying unmanaged DLL libadonetHDB.dll should also be present into the program folder (along with "Sap.Data.Hana.Core.v2.1.dll")

                    var config = DatabaseConfiguration.Build()
                           .UsingConnectionString(GetCompanySAPDataConnectionStringHana(Profile))
                           .UsingProvider<PetaPoco.Providers.Custom.PetaPocoHanaDatabaseNetCoreProvider>()
                           .UsingDefaultMapper<PetaPoco.Custom.Mappers.PetaPocoB1Mapper>();    //PetaPocoB1Mapper uses attributes to support conversions such as "Y"/"N" to boolean and also converts HanaDecimal to Decimal

                    return config;
                }
                else
                {
                    ////try to load the old Sap.Data.Hana.v4.5.dll
                    ////this might end badly because this library is built with Sap.Data.Hana.Core.v2.1.dll and just loading the assembly is probably not enough

                    //InitialiseSapDataHanaCore45Provider();

                    //var config = DatabaseConfiguration.Build()
                    //    .UsingConnectionString(GetCompanySAPDataConnectionStringHana(Profile))
                    //    .UsingProvider<PetaPoco.Providers.Custom.OchibaHANAProvider>()
                    //    .UsingDefaultMapper<PetaPoco.Custom.Mappers.PetaPocoB1Mapper>();    //PetaPocoB1Mapper uses attributes to support conversions such as "Y"/"N" to boolean

                    //return config;
                }
            }
            else
            {
                var config = DatabaseConfiguration.Build()
                    .UsingConnectionString(GetCompanySAPDataConnectionStringMSSQL(Profile))
                    .UsingProvider<PetaPoco.Providers.SqlServerDatabaseProvider>()
                    .UsingDefaultMapper<PetaPoco.Custom.Mappers.PetaPocoB1Mapper>();

                return config;
            }
        }

        public static string GetCompanySAPDataConnectionStringHana(SAPB1Commons.B1Types.B1DirectDBProfile Profile)
        {
            //Console.WriteLine("GetCompanySAPDataConnectionString(): ServerName: " + ServerName + ", DatabaseName: " + DatabaseName + ", Tenant: " + Tenant);

            Sap.Data.Hana.HanaConnectionStringBuilder CSB = new Sap.Data.Hana.HanaConnectionStringBuilder();

            CSB.Server = Profile.DBServerName;
            CSB.UserName = Profile.DBUserName;
            CSB.Password = Profile.DBPassword;
            CSB.CurrentSchema = Profile.DatabaseName;
            if (!(string.IsNullOrEmpty(Profile.DBTenantName) || Profile.DBTenantName.ToUpper() == "NONE")) CSB.Database = Profile.DBTenantName;

            //Console.WriteLine(CSB.ConnectionString);

            return CSB.ConnectionString;
        }

        public static string GetCompanySAPDataConnectionStringMSSQL(SAPB1Commons.B1Types.B1DirectDBProfile Profile)
        {
            var CSB = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder();

            CSB.DataSource = Profile.DBServerName;
            CSB.UserID = Profile.DBUserName;
            CSB.Password = Profile.DBPassword;
            CSB.InitialCatalog = Profile.DatabaseName;

            // Console.WriteLine(CSB.ConnectionString)

            return CSB.ConnectionString;
        }

    }
}
