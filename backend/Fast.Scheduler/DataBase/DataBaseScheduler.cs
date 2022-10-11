﻿using System.Diagnostics;
using Fast.Core;
using Fast.Core.AdminFactory.EnumFactory;
using Fast.Core.AdminFactory.ModelFactory.Tenant;
using Fast.Core.AdminFactory.ServiceFactory.Tenant;
using Fast.Core.Const;
using Fast.Core.SqlSugar;
using Fast.Iaas.Util;
using Furion.DependencyInjection;
using Furion.TaskScheduler;
using Microsoft.Extensions.DependencyInjection;
using SqlSugar;

namespace Fast.Scheduler.DataBase;

/// <summary>
/// 数据库任务调度
/// </summary>
public class DataBaseJobWorker : ISpareTimeWorker
{
    /// <summary>
    /// 初始化数据库
    /// </summary>
    /// <param name="timer"></param>
    /// <param name="count"></param>
    [SpareTime(3000, "初始化数据库", DoOnce = true, StartNow = true)]
    public async Task InitDataBast(SpareTimer timer, long count)
    {
        if (GlobalContext.SystemSettingsOptions?.InitDataBase != true)
            return;

        await Scoped.CreateAsync(async (_, scope) =>
        {
            var service = scope.ServiceProvider;

            var db = service.GetService<ISqlSugarClient>();

            // ReSharper disable once PossibleNullReferenceException
            var _db = db.AsTenant().GetConnection(GlobalContext.ConnectionStringsOptions.DefaultConnectionId);
            var _sysTenantService = service.GetService<ISysTenantService>();

            // 创建核心业务库
            _db.DbMaintenance.CreateDatabase();

            // 查询核心表是否存在
            if (await _db.Ado.GetIntAsync(
                    $"SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_NAME = '{typeof(SysTenantModel).GetSugarTableName()}'") >
                0)
                return;

            var sw = new Stopwatch();
            sw.Start();

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(@"
            
             初始化数据库中......
              
            ");
            // 获取所有数据库Model
            var entityTypeList = SqlSugarSetup.EntityHelper.ReflexGetAllTEntityList();

            // 创建核心业务库的所有表
            _db.CodeFirst.InitTables(entityTypeList.Where(wh => wh.dbType == SysDataBaseTypeEnum.Admin).Select(sl => sl.type)
                .ToArray());

            // 初始化租户信息
            var superAdminTenantInfo = new SysTenantModel
            {
                Id = ClaimConst.DEFAULT_SUPERADMIN_TENANT_ID,
                Name = "Fast.NET",
                NamePinYin = "FastNet",
                ShortName = "Fast",
                ShortNamePinYin = "Fast",
                Secret = StringUtil.GetGuid(),
                AdminName = "租户管理员",
                Email = "email@gmail.com",
                Phone = "15288888888",
                TenantType = TenantTypeEnum.System,
                WebUrl = new List<string> {"http:fast.18kboy.icu", "http:127.0.0.1:8080"},
                LogoUrl = "https://gitee.com/Net-18K/Fast.NET/raw/master/frontend/public/logn.png"
            };
            superAdminTenantInfo = await _db.Insertable(superAdminTenantInfo).ExecuteReturnEntityAsync();

            // 初始化租户业务库信息
            await _db.Insertable(new SysTenantDataBaseModel
            {
                ServiceIp = GlobalContext.ConnectionStringsOptions.DefaultServiceIp,
                Port = GlobalContext.ConnectionStringsOptions.DefaultPort,
                DbName = $"Fast.Main_{superAdminTenantInfo.ShortNamePinYin}",
                DbUser = GlobalContext.ConnectionStringsOptions.DefaultDbUser,
                DbPwd = GlobalContext.ConnectionStringsOptions.DefaultDbPwd,
                SysDbType = SysDataBaseTypeEnum.Tenant,
                DbType = GlobalContext.ConnectionStringsOptions.DefaultDbType,
                TenantId = superAdminTenantInfo.Id
            }).ExecuteCommandAsync();

            // 初始化新租户数据
            // ReSharper disable once PossibleNullReferenceException
            await _sysTenantService.InitNewTenant(superAdminTenantInfo,
                entityTypeList.Where(wh => wh.dbType == SysDataBaseTypeEnum.Tenant).Select(sl => sl.type), true);

            sw.Stop();

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(@$"
            
             数据库初始化完成！
             用时（毫秒）：{sw.ElapsedMilliseconds}
              
            ");
        });
    }
}