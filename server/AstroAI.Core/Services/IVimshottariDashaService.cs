namespace AstroAI.Core.Services;

public interface IVimshottariDashaService
{
    DashaStatus ComputeCurrent(DateTime birthUtc, DateTime currentUtc, double moonSiderealLongitudeDeg, string moonNakshatra);
}

public sealed record DashaPeriod(string Lord, DateTime StartUtc, DateTime EndUtc);

public sealed record DashaStatus(
    string MahaDashaLord,
    DashaPeriod MahaPeriod,
    string AntarDashaLord,
    DashaPeriod AntarPeriod);
