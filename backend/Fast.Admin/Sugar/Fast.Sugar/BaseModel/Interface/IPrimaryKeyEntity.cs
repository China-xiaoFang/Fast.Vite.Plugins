﻿// ReSharper disable once CheckNamespace
namespace Fast.Sugar.BaseModel;

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