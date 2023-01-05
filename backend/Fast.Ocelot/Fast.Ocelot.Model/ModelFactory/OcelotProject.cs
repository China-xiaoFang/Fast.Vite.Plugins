﻿using Fast.Core.AdminFactory.EnumFactory;
using Fast.Core.SqlSugar.AttributeFilter;
using Fast.Core.SqlSugar.BaseModel;
using SqlSugar;

namespace Fast.Ocelot.Model.ModelFactory;

/// <summary>
/// 网关项目表
/// </summary>
[SugarTable("Ocelot_Project", "网关项目表")]
[DataBaseType]
public class OcelotProject : BaseEntity
{
    /// <summary>
    /// 项目名称 
    ///</summary>
    [SugarColumn(ColumnDescription = "项目名称", ColumnDataType = "Nvarchar(50)", IsNullable = false)]
    public string ProjectName { get; set; }

    /// <summary>
    /// 顺序
    /// </summary>
    [SugarColumn(ColumnDescription = "顺序", IsNullable = false)]
    public int Sort { get; set; }

    /// <summary>
    /// 状态
    /// </summary>
    [SugarColumn(ColumnDescription = "状态", IsNullable = false)]
    public CommonStatusEnum Status { get; set; } = CommonStatusEnum.Enable;
}