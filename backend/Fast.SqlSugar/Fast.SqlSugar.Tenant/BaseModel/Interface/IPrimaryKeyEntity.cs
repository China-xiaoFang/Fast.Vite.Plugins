﻿namespace Fast.SqlSugar.Tenant.BaseModel.Interface;

/// <summary>
/// 主键接口
/// </summary>
/// <typeparam name="T"></typeparam>
public interface IPrimaryKeyEntity<T>
{
    /// <summary>
    /// 主键Id
    /// </summary>
    T Id { get; set; }
}