class Base 
{
protected:
	int mBaseMember;
};

namespace d1{
class Derived1: public Base
{
private:
	int mDerivedMember;
};
}

class Derived2: public Derived1
{
private:
	int mDerived2Member;
};


class MemberDerived
{
private:
	Base mNotDerivedMember;
};

namespace multi {
	class MultiDerived: public Derived1, public MemberDerived
	{
	private:
		int mMultiDerivedMember;
	};
}

int main(int argc, char** argv)
{
	Base a;
	Derived1 b;
	Derived2 c;
	MemberDerived d;
	MultiDerived e;
}
