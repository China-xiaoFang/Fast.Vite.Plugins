﻿using Fast.SqlSugar.Tenant.Const;
using Fast.SqlSugar.Tenant.Filter;
using Fast.SqlSugar.Tenant.SugarEntity;
using Microsoft.Extensions.Caching.Memory;
using SqlSugar;

namespace Fast.SqlSugar.Tenant.Helper;

/// <summary>
/// SqlSugarClient帮助类
/// </summary>
static class SqlSugarClientHelper
{
    /// <summary>
    /// 得到DbInfo
    /// </summary>
    /// <param name="_db"></param>
    /// <param name="dbType"></param>
    /// <param name="tenantId"></param>
    /// <returns></returns>
    public static SysTenantDataBaseModel GetDbInfo(ISqlSugarClient _db, int dbType, long tenantId)
    {
        var _cache = SugarContext._memoryCache;
        // 数据库信息缓存
        var dbInfoList = _cache.Get<List<SysTenantDataBaseModel>>($"{SugarCacheConst.TenantDbInfo}{tenantId}");
        if (dbInfoList == null || !dbInfoList.Any())
        {
            dbInfoList = _db.Queryable<SysTenantDataBaseModel>().Where(wh => wh.TenantId == tenantId).Filter(null, true).ToList();
            _cache.Set($"{SugarCacheConst.TenantDbInfo}{tenantId}", dbInfoList);
        }

        var db = dbInfoList.FirstOrDefault(f => f.SugarSysDbType == dbType);
        if (db == null)
        {
            // 租户数据库配置异常！
            throw new SqlSugarException("The tenant database configuration is abnormal!");
        }

        return db;
    }

    /// <summary>
    /// 得到SqlSugar客户端
    /// </summary>
    /// <param name="_tenant"></param>
    /// <param name="dbInfo"></param>
    /// <returns></returns>
    public static ISqlSugarClient GetSqlSugarClient(ITenant _tenant, SysTenantDataBaseModel dbInfo)
    {
        var connectionId = $"{dbInfo.SugarSysDbType}_{dbInfo.TenantId}";

        if (_tenant.IsAnyConnection(connectionId))
            return _tenant.GetConnection(connectionId);

        _tenant.AddConnection(new ConnectionConfig
        {
            ConfigId = connectionId, // 此链接标志，用以后面切库使用
            ConnectionString = DataBaseHelper.GetConnectionStr(dbInfo), // 租户库连接字符串
            DbType = dbInfo.DbType,
            IsAutoCloseConnection = true, // 开启自动释放模式和EF原理一样我就不多解释了
            InitKeyType = InitKeyType.Attribute, // 从特性读取主键和自增列信息
            //InitKeyType = InitKeyType.SystemTable // 从数据库读取主键和自增列信息
            ConfigureExternalServices = DataBaseHelper.GetSugarExternalServices(dbInfo.DbType)
        });

        var _db = _tenant.GetConnection(connectionId);

        // 过滤器
        SugarEntityFilter.LoadSugarFilter(_db);

        return _db;
    }
}