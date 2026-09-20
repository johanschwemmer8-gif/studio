'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import {
  getReportingCalendarConfiguration,
  saveReportingCalendarConfiguration,
} from '@/ai/flows/manage-reporting-calendar';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const COMMON_TIMEZONES = [
  'Africa/Johannesburg',
  'Africa/Harare',
  'Africa/Windhoek',
  'Africa/Gaborone',
  'Africa/Maputo',
  'Europe/London',
  'Europe/Brussels',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
];

type FormState = {
  timezone: string;
  financialYearStartMonth: number;
  weekStartsOn: number;
};

function financialPeriodLabels(startMonth: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = (startMonth - 1 + index) % 12;

    return {
      period: `P${String(index + 1).padStart(2, '0')}`,
      month: MONTHS[monthIndex],
    };
  });
}

function financialYearPreview(startMonth: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const startYear =
    currentMonth >= startMonth ? currentYear : currentYear - 1;

  const endMonth = startMonth === 1 ? 12 : startMonth - 1;
  const endYear = startMonth === 1 ? startYear : startYear + 1;

  return {
    start: `1 ${MONTHS[startMonth - 1]} ${startYear}`,
    end: `${MONTHS[endMonth - 1]} ${endYear}`,
  };
}

export function ReportingCalendarManager() {
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    timezone: 'Africa/Johannesburg',
    financialYearStartMonth: 1,
    weekStartsOn: 1,
  });

  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const periods = useMemo(
    () => financialPeriodLabels(form.financialYearStartMonth),
    [form.financialYearStartMonth]
  );

  const preview = useMemo(
    () => financialYearPreview(form.financialYearStartMonth),
    [form.financialYearStartMonth]
  );

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setSaved(false);

    try {
      if (!user) {
        setLoadError('Authentication required.');
        return;
      }

      const idToken = await user.getIdToken();
      const result = await getReportingCalendarConfiguration(idToken);

      if (!result.success) {
        setLoadError(result.error);
        return;
      }

      setConfigured(result.configured);

      if (result.calendar) {
        setForm({
          timezone: result.calendar.timezone,
          financialYearStartMonth:
            result.calendar.financialYearStartMonth,
          weekStartsOn: result.calendar.weekStartsOn,
        });
      }
    } catch (error) {
      console.error('Reporting Calendar load failed:', error);
      setLoadError('Reporting Calendar could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const saveCalendar = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      if (!user) {
        setSaveError('Authentication required.');
        return;
      }

      const idToken = await user.getIdToken();

      const result = await saveReportingCalendarConfiguration(idToken, {
        timezone: form.timezone,
        financialYearStartMonth: form.financialYearStartMonth,
        weekStartsOn: form.weekStartsOn,
        calendarType: 'GREGORIAN_MONTHLY',
      });

      if (!result.success) {
        setSaveError(result.error);
        return;
      }

      setConfigured(true);
      setSaved(true);

      if (result.calendar) {
        setForm({
          timezone: result.calendar.timezone,
          financialYearStartMonth:
            result.calendar.financialYearStartMonth,
          weekStartsOn: result.calendar.weekStartsOn,
        });
      }
    } catch (error) {
      console.error('Reporting Calendar save failed:', error);
      setSaveError('Reporting Calendar could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="reporting-calendar">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Reporting Calendar
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl">
              Define the authoritative reporting periods used across
              iNteract for operational trends and financial reporting.
            </CardDescription>
          </div>

          <div className="text-sm font-medium">
            {configured ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Configured
              </span>
            ) : (
              <span>Not configured</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading Reporting Calendar...
            </span>
          </div>
        ) : loadError ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Reporting Calendar unavailable</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                The current Reporting Calendar could not be verified.
                No calendar defaults have been treated as authoritative.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadCalendar()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {!configured && (
              <Alert>
                <CalendarDays className="h-4 w-4" />
                <AlertTitle>Reporting Calendar not configured</AlertTitle>
                <AlertDescription>
                  Configure the retailer&apos;s reporting calendar before
                  financial-year and calendar-based trend periods are used.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Reporting Timezone</Label>
                <Select
                  value={form.timezone}
                  onValueChange={(timezone) =>
                    setForm((current) => ({
                      ...current,
                      timezone,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Financial Year Starts</Label>
                <Select
                  value={String(form.financialYearStartMonth)}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      financialYearStartMonth: Number(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem
                        key={month}
                        value={String(index + 1)}
                      >
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Week Starts On</Label>
                <Select
                  value={String(form.weekStartsOn)}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      weekStartsOn: Number(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Calendar Structure</Label>
                <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                  Calendar Months
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-bold">Current Financial Year Preview</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Starts {preview.start}. Ends in {preview.end}.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Financial-year boundaries are derived from the configured
                start month. The end boundary is not independently entered,
                preventing contradictory calendar definitions.
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">Financial Periods</p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {periods.map((period) => (
                  <div
                    key={period.period}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-bold">{period.period}</span>
                    <span className="text-muted-foreground">
                      {period.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {saveError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Reporting Calendar not saved</AlertTitle>
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            {saved && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Reporting Calendar saved</AlertTitle>
                <AlertDescription>
                  The authoritative retailer Reporting Calendar has been
                  updated.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void saveCalendar()}
                disabled={saving}
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Reporting Calendar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
