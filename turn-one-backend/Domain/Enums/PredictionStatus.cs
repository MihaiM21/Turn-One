namespace Domain.Enums
{
    public enum PredictionStatus
    {
        PENDING,     // Waiting for race to complete
        WON,         // User won the prediction
        LOST,        // User lost the prediction
        PARTIAL,     // Partially correct
        CANCELLED    // Race cancelled or prediction void
    }
}
