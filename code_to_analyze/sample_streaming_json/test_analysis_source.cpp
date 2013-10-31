class Base 
{
protected:
	int mBaseMember;
};

class Derived1: public Base
{
private:
	int mDerivedMember;
};

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

class MultiDerived: public Derived1, public NotDerived
{
private:
	int mMultiDerivedMember;
};

int main(int argc, char** argv)
{
	Base a;
	Derived1 b;
	Derived2 c;
	NotDerived d;
	MultiDerived e;
}
