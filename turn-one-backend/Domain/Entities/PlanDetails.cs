using Domain.Enums;

namespace Domain.Entities;

public class PlanDetails
{
    public PlanType Type { get; set; }
    public int MonthlyTokens { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal TokenPurchaseDiscount { get; set; } // Percentage as decimal (0.1 = 10%)
    
    public static readonly PlanDetails Basic = new()
    {
        Type = PlanType.BASIC,
        MonthlyTokens = 30,
        MonthlyPrice = 0,
        TokenPurchaseDiscount = 0
    };
    
    public static readonly PlanDetails Pro = new()
    {
        Type = PlanType.PRO,
        MonthlyTokens = 100,
        MonthlyPrice = 9.99m,
        TokenPurchaseDiscount = 0.10m // 10% discount
    };
    
    public static readonly PlanDetails Elite = new()
    {
        Type = PlanType.ELITE,
        MonthlyTokens = 250,
        MonthlyPrice = 19.99m,
        TokenPurchaseDiscount = 0.25m // 25% discount
    };
    
    
    public static PlanDetails GetPlanDetails(PlanType type) => type switch
    {
        PlanType.BASIC => Basic,
        PlanType.PRO => Pro,
        PlanType.ELITE => Elite,
        _ => Basic
    };
}