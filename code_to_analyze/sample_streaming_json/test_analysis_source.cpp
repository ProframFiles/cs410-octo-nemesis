struct podstruct
{
	podstruct(int in):x(in), y(in), z(in){}
	int x;
	int y;
	int z;
};

class Base 
{
protected:
	int mBaseMember;
};

namespace d1{
class Derived1: public Base
{
	podstruct DerivedMethod1(int qw)
	{
		podstruct p(qw);
		podstruct q(qw);
		p.x = 2;
		return p;
	}
private:
	int mDerivedMember;
};
}

class Derived2: public d1::Derived1
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
	class MultiDerived: public d1::Derived1, public MemberDerived
	{
	private:
		int mMultiDerivedMember;
	};
}

int main(int argc, char** argv)
{
	Base a;
	d1::Derived1 b;
	Derived2 c;
	MemberDerived d;
	multi::MultiDerived e;
}
