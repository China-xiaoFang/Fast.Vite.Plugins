﻿using Fast.Core.AdminService.Cache;
using Fast.Core.AdminService.Cache.Dto;
using Fast.Iaas.Const;
using Furion.DynamicApiController;
using Microsoft.AspNetCore.Mvc;

namespace Fast.Admin.Application.Cache;

/// <summary>
/// 缓存接口
/// </summary>
[ApiDescriptionSettings(ApiGroupConst.Web, Name = "Cache", Order = 100)]
public class CacheApplication : IDynamicApiController
{
    private readonly ISysCacheService _sysCacheService;

    public CacheApplication(ISysCacheService sysCacheService)
    {
        _sysCacheService = sysCacheService;
    }

    /// <summary>
    /// 获取所有缓存Key
    /// </summary>
    /// <returns></returns>
    [HttpGet("getAllCacheKey", "获取所有缓存Key", HttpRequestActionEnum.Page)]
    public List<string> GetAllCacheKey()
    {
        return _sysCacheService.GetAllCacheKey();
    }

    /// <summary>
    /// 获取缓存值
    /// </summary>
    /// <param name="key"></param>
    /// <returns></returns>
    [HttpGet("getCacheValue", "获取缓存值", HttpRequestActionEnum.Page)]
    public async Task<string> GetCacheValue(string key)
    {
        return await _sysCacheService.GetCacheValue(key);
    }

    /// <summary>
    /// 设置缓存值
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    [HttpPut("editCacheValue", "设置缓存值", HttpRequestActionEnum.Update)]
    public async Task EditCacheValue(EditCacheValueInput input)
    {
        await _sysCacheService.EditCacheValue(input);
    }

    /// <summary>
    /// 删除缓存
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    [HttpDelete("deleteCacheValue", "删除缓存", HttpRequestActionEnum.Delete)]
    public async Task DeleteCacheValue(DeleteCacheValueInput input)
    {
        await _sysCacheService.DeleteCacheValue(input);
    }
}