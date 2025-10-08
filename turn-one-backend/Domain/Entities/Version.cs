namespace Domain.Entities
{
    public class Version
    {
        public int Id { get; set; }
        public int Major { get; set; }
        public int Minor { get; set; }
        public int Patch { get; set; }
        public string? PreRelease { get; set; }
        public string? BuildMetadata { get; set; }
        public DateTime ReleasedAt { get; set; }
        public string ReleaseNotes { get; set; } = string.Empty;
        
        public string VersionString => $"{Major}.{Minor}.{Patch}" +
            (string.IsNullOrEmpty(PreRelease) ? "" : $"-{PreRelease}") +
            (string.IsNullOrEmpty(BuildMetadata) ? "" : $"+{BuildMetadata}");
            
        public static Version Parse(string versionString)
        {
            Version version = new Version();
            
            // Parse build metadata if present
            string[] versionBuildSplit = versionString.Split('+');
            if (versionBuildSplit.Length > 1)
            {
                version.BuildMetadata = versionBuildSplit[1];
            }
            
            // Parse pre-release if present
            string[] versionPreReleaseSplit = versionBuildSplit[0].Split('-');
            if (versionPreReleaseSplit.Length > 1)
            {
                version.PreRelease = versionPreReleaseSplit[1];
            }
            
            // Parse version numbers
            string[] versionNumbers = versionPreReleaseSplit[0].Split('.');
            if (versionNumbers.Length >= 3)
            {
                version.Major = int.Parse(versionNumbers[0]);
                version.Minor = int.Parse(versionNumbers[1]);
                version.Patch = int.Parse(versionNumbers[2]);
            }
            
            return version;
        }
    }
}