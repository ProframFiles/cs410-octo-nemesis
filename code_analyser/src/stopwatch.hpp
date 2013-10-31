#pragma once
#include <stdint.h>
#if (defined _WIN32 || defined WIN32)
	#include "windows.h"
	#pragma comment(lib, "winmm.lib")
#else
	#include <time.h>
	#include <sys/time.h>
#endif
namespace akj {
	class cStopWatch
	{
	public:
		cStopWatch()
		{
			mPeriod = QueryPeriod();
			Start();
		}
		~cStopWatch(){};

		void Start()
		{
			mStartTicks = QueryTimer();
			mNowTicks = mStartTicks;
		}

		double Stop()
		{
			mNowTicks=QueryTimer();
			return Read();
		}
		int64_t GetTicks() const
		{
			return QueryTimer();
		}
		double Read() const
		{
			if(mNowTicks != mStartTicks)
			{
				return mPeriod*(mNowTicks - mStartTicks);
			}
			return mPeriod*(QueryTimer() - mStartTicks);
		}
	private:
		uint64_t QueryTimer() const
		{
			#if (defined _WIN32 || defined WIN32)
				LARGE_INTEGER time_start;
				QueryPerformanceCounter(&time_start);
				return static_cast<uint64_t>(time_start.QuadPart);
			#else
				timespec ts;
				clock_gettime(CLOCK_MONOTONIC, &ts);
				return static_cast<uint64_t>(ts.tv_sec*1000000000 + ts.tv_nsec);
			#endif
		}
		double QueryPeriod() const
		{
			#if (defined _WIN32 || defined WIN32)
				LARGE_INTEGER frequency;
				QueryPerformanceFrequency(&frequency);
				return 1.0/frequency.QuadPart;
			#else
				return 1e-9;
			#endif
		}

		uint64_t mStartTicks;
		uint64_t mNowTicks;
		double mPeriod;
	};

} // end namespace akj
